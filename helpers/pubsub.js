class Pubsub {
    constructor() {
        this.events = {};
    }
    
    subscription (eventName, func) {
        return {
            subscribe: () => {
                if (this.events[eventName]) {
                    this.events[eventName].push(func);
                    console.log(`${func.name} has subscribed to ${eventName} Topic!`)
                } else {
                    this.events[eventName] = [func];
                    console.log(`${func.name} has subscribed to ${eventName} Topic!`)
                }
            },
            
            unsubscribe: () => {
                if(this.events[eventName]){
                    this.events[eventName] = this.events[eventName].filter((subscriber) => subscriber !== func);
                    console.log(`${func.name} has unsubscribed from ${eventName} Topic!`)
                }
            }
            
            
        }
    } 
    
    publish(eventName, ...args) {
        const funcs = this.events[eventName];
        if (Array.isArray(funcs)) {
            funcs.forEach((func) => {
                func.apply(null, args);
            });
        }
    }
}

const pubsub = new Pubsub();

module.exports = pubsub