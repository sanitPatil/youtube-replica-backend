const AsyncHandler = (requestedMethod) => {
	return (req, res, next) => {
		Promise.resolve(requestedMethod(req, res, next)).catch((error) =>
			next(error)
		);
	};
};

export { AsyncHandler };
