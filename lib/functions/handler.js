import {sendMessageToSQS, saveItemToDynamoDB, getItemFromDynamoDB} from './helpers.js'
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
    console.log(event['Records'][0]);
    const orderId = JSON.parse(event['Records'][0].body).orderId;

    // Check if order exists before updating
    const orderDetails = await getItemFromDynamoDB(process.env.ORDERS_TABLE_NAME, 'orderId', orderId);

    if (orderDetails) {
        console.log('Order exists, update status: ', orderDetails);
        orderDetails['status'] = 'preparing';
        await saveItemToDynamoDB(orderDetails, process.env.ORDERS_TABLE_NAME);
        return {
            statusCode: 200,
            body: JSON.stringify(orderDetails),
        };
    }

    console.log('Order does not exist: ', orderDetails);
    return {
        statusCode: 404,
        body: JSON.stringify({message: 'Order not found'}),
    }
}

export const sendOrder = async (event) => {
    console.log(event);

    const order = {
        orderId: event.orderId,
        pizza: event.pizza,
        customerId: event.customerId
    }

    await sendMessageToSQS(order, process.env.ORDERS_TO_SEND_QUEUE_URL);

    return;
}