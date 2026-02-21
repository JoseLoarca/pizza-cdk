import {sendMessageToSQS, saveItemToDynamoDB, getItemFromDynamoDB, updateStatusInOrder} from './helpers.js'
import {v4 as uuidv4} from 'uuid';

// API Gateway -> POST /order
export const newOrder = async (event) => {
    console.log(event);

    const orderId = uuidv4();
    console.log(orderId);

    let orderDetails;
    try {
        orderDetails = JSON.parse(event.body);
        orderDetails['status'] = 'received';
    } catch (error) {
        console.error('Error parsing order details:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({message: 'Invalid order details'}),
        };
    }

    console.log(orderDetails);

    const order = {orderId, ...orderDetails};

    await saveItemToDynamoDB(order, process.env.ORDERS_TABLE_NAME);
    await sendMessageToSQS(order, process.env.PENDING_ORDERS_QUEUE_URL);

    return {
        statusCode: 200,
        body: JSON.stringify({message: 'Order received', order}),
    };
}

// API Gateway -> GET /order/{orderId}
export const getOrder = async (event) => {
    console.log(event);

    const orderId = event.pathParameters.orderId;
    console.log(orderId);

    const orderDetails = await getItemFromDynamoDB(process.env.ORDERS_TABLE_NAME, 'orderId', orderId);

    if (orderDetails) {
        return {
            statusCode: 200,
            body: JSON.stringify(orderDetails),
        };
    }

    return {
        statusCode: 404,
        body: JSON.stringify({message: 'Order not found'}),
    }
}

// SQS -> Prep Order
export const prepOrder = async (event) => {
    console.log('Will update order: ', event['Records'][0]);
    const orderId = JSON.parse(event['Records'][0].body).orderId;
    await updateStatusInOrder(orderId, "completed");
}

export const sendOrder = async (event) => {
    console.log(event);

    if (event.Records[0].eventName === 'MODIFY') {
        const body = event.Records[0].dynamodb;
        console.log(body);

        const orderDetails = body.NewImage;

        const order = {
            orderId: orderDetails.orderId.S,
            pizza: orderDetails.pizza.S,
            clientId: orderDetails.clientId.N,
            status: orderDetails.status.S,
        }

        console.log('Updated order, ', order)

        await sendMessageToSQS(order, process.env.ORDERS_TO_SEND_QUEUE_URL);
    }

    return;
}