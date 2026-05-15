export declare class ApiError extends Error {
    statusCode: number;
    errors?: Array<{
        message: string;
        field?: string;
    }>;
    constructor(statusCode: number, message: string, errors?: Array<{
        message: string;
        field?: string;
    }>);
}
export declare class ValidationError extends ApiError {
    constructor(message: string, errors?: Array<{
        message: string;
        field?: string;
    }>);
}
export declare class UnauthorizedError extends ApiError {
    constructor(message?: string);
}
export declare class ForbiddenError extends ApiError {
    constructor(message?: string);
}
export declare class NotFoundError extends ApiError {
    constructor(message?: string);
}
export declare class ConflictError extends ApiError {
    constructor(message?: string);
}
export declare class InternalServerError extends ApiError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map