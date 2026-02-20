import {SQSClient, SendMessageCommand} from '@aws-sdk/client-sqs';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand, PutCommand} from '@aws-sdk/lib-dynamodb';

// SQS Client
const sqsClient = new SQSClient();

// DynamoDB Client & doc client
const dynamoClient = new DynamoDBClient()
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Sends a message to a SQS queue
 *
 * @param message - message to be sent
 * @param queue_url - the queue that will receive the message
 *
 * @returns {string} The metadata of the message sent
 */
export async function sendMessageToSQS(message, queue_url) {
    const params = {
        QueueUrl: queue_url,
        MessageBody: JSON.stringify(message)
    };

    console.log("Sending msg to SQS: ", params);
    console.log(params);

    try {
        const command = new SendMessageCommand(params);
        const data = await sqsClient.send(command);
        console.log("Message sent successfully: ", data.MessageId)

        return data;
    } catch (error) {
        console.error("Could not send message: ", error);
        throw error;
    }
}


/**
 * Saves a new items in a DynamoDB table
 *
 * @param item - item to be saved
 * @param table - table name to use
 *
 * @returns {string} The metadata of the item saved
 */
export async function saveItemToDynamoDB(item, table) {
    const params = {
        TableName: table,
        Item: item
    }

    console.log("Sending item to DynamoDB: ", params);

    try {
        const command = new PutCommand(params);
        const response = await docClient.send(command);
        console.log("Item saved successfully: ", response);
        return response;
    } catch (error) {
        console.log("Could not save item: ", error);
        throw error;
    }
}

export async function getItemFromDynamoDB(table, key, val) {
    const input = {
        TableName: table,
        Key: {
            [key]: val
        }
    }

    console.log("Getting item from DynamoDB: ", input);

    try {
        const command = new GetCommand(input);
        const response = await docClient.send(command);
        console.log("Item retrieved successfully: ", response);
        return response.Item;
    } catch (error) {
        console.log("Could not get item: ", error);
        throw error;
    }
}