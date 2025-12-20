class HttpException extends Error {
    public status: number;
    public message: string;
    public isHttpException: boolean = true; // ✅ Flag identifier

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.message = message;
        this.name = 'HttpException'; // ✅ Set proper name
        
        // ✅ Maintain proper prototype chain
        Object.setPrototypeOf(this, HttpException.prototype);
    }
}

export default HttpException;