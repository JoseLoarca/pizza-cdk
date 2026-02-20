import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Code, Function, Runtime} from 'aws-cdk-lib/aws-lambda';
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway';
import {Queue} from 'aws-cdk-lib/aws-sqs';
import {SqsEventSource} from 'aws-cdk-lib/aws-lambda-event-sources';
import {AttributeType, BillingMode, Table} from "aws-cdk-lib/aws-dynamodb";

export class CdkPizzaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Dynamo DB
        const ordersTable = new Table(this, 'OrdersTable', {
            partitionKey: {name: 'orderId', type: AttributeType.STRING},
            billingMode: BillingMode.PAY_PER_REQUEST
        });

        // SQS
        const pendingOrdersQueue = new Queue(this, 'PendingOrdersQueue', {});
        const ordersToSendQueue = new Queue(this, 'OrdersToSendQueue', {});

        // Functions
        const newOrderFunction = new Function(this, 'NewOrderFunction', {
            runtime: Runtime.NODEJS_24_X,
            handler: 'handler.newOrder',
            code: Code.fromAsset('lib/functions'),
            environment: {
                PENDING_ORDERS_QUEUE_URL: pendingOrdersQueue.queueUrl,
                ORDERS_TABLE_NAME: ordersTable.tableName
            }
        });

        pendingOrdersQueue.grantSendMessages(newOrderFunction);
        ordersTable.grantWriteData(newOrderFunction);

        const getOrderFunction = new Function(this, 'GetOrderFunction', {
            runtime: Runtime.NODEJS_24_X,
            handler: 'handler.getOrder',
            code: Code.fromAsset('lib/functions'),
        });

        const prepOrderFunction = new Function(this, 'PrepOrderFunction', {
            runtime: Runtime.NODEJS_24_X,
            handler: 'handler.prepOrder',
            code: Code.fromAsset('lib/functions')
        });

        prepOrderFunction.addEventSource(new SqsEventSource(pendingOrdersQueue, {
            batchSize: 1
        }));

        const sendOrderFunction = new Function(this, 'SendOrderFunction', {
            runtime: Runtime.NODEJS_24_X,
            handler: 'handler.sendOrder',
            code: Code.fromAsset('lib/functions'),
            environment: {
                ORDERS_TO_SEND_QUEUE_URL: ordersToSendQueue.queueUrl
            }
        })

        ordersToSendQueue.grantSendMessages(sendOrderFunction)

        // API Gateway
        const api = new RestApi(this, 'PizzaApi', {
            restApiName: 'Pizza CDK Service'
        });

        const orderResource = api.root.addResource('order');
        orderResource.addMethod('POST', new LambdaIntegration(newOrderFunction));
        orderResource.addResource('{orderId}').addMethod('GET', new LambdaIntegration(getOrderFunction));
    }
}
