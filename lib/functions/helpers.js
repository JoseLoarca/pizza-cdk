import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
const sqsClient = new SQSClient({});

export function getRandomStatus(){
    const statuses = ['received', 'preparing', 'ready', 'delivered'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

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