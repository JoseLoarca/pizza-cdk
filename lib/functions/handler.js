import { v4 as uuidv4 } from 'uuid';
import { getRandomStatus } from './helpers.js'

// API Gateway -> POST /order
export const newOrder = async (event) => {
    console.log(event);

    const orderId = uuidv4();
    console.log(orderId);

    let orderDetails;
    try {
        orderDetails = JSON.parse(event.body);
    } catch (error) {
        console.error('Error parsing order details:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid order details' }),
        };
    }

    console.log(orderDetails);

    const order = {orderId, ...orderDetails};

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Order received', order }),
    };
}

// API Gateway -> GET /order/{orderId}
export const getOrder = async (event) => {
    console.log(event);
    
    const orderId = event.pathParameters.orderId;
    console.log(orderId);

    const status = getRandomStatus();

    return {
        statusCode: 200,
        body: JSON.stringify({ status: status, orderId: orderId }),
    };
}

// SQS -> Prep Order
export const prepOrder = async (event) => {
    console.log(event);

    return;
}