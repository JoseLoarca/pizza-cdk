export function getRandomStatus(){
    const statuses = ['received', 'preparing', 'ready', 'delivered'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}