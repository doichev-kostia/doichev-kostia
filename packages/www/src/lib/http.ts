export const HttpStatusCode = {
	continue: 100, // RFC 9110, 15.2.1
	switchingProtocols: 101, // RFC 9110, 15.2.2
	processing: 102, // RFC 2518, 10.1
	earlyHints: 103, // RFC 8297

	ok: 200, // RFC 9110, 15.3.1
	created: 201, // RFC 9110, 15.3.2
	accepted: 202, // RFC 9110, 15.3.3
	nonAuthoritativeInfo: 203, // RFC 9110, 15.3.4
	noContent: 204, // RFC 9110, 15.3.5
	resetContent: 205, // RFC 9110, 15.3.6
	partialContent: 206, // RFC 9110, 15.3.7
	multiStatus: 207, // RFC 4918, 11.1
	alreadyReported: 208, // RFC 5842, 7.1
	imUsed: 226, // RFC 3229, 10.4.1

	multipleChoices: 300, // RFC 9110, 15.4.1
	movedPermanently: 301, // RFC 9110, 15.4.2
	found: 302, // RFC 9110, 15.4.3
	seeOther: 303, // RFC 9110, 15.4.4
	notModified: 304, // RFC 9110, 15.4.5
	useProxy: 305, // RFC 9110, 15.4.6
	_: 306, // RFC 9110, 15.4.7 (Unused)
	temporaryRedirect: 307, // RFC 9110, 15.4.8
	permanentRedirect: 308, // RFC 9110, 15.4.9

	badRequest: 400, // RFC 9110, 15.5.1
	unauthorized: 401, // RFC 9110, 15.5.2
	paymentRequired: 402, // RFC 9110, 15.5.3
	forbidden: 403, // RFC 9110, 15.5.4
	notFound: 404, // RFC 9110, 15.5.5
	methodNotAllowed: 405, // RFC 9110, 15.5.6
	notAcceptable: 406, // RFC 9110, 15.5.7
	proxyAuthRequired: 407, // RFC 9110, 15.5.8
	requestTimeout: 408, // RFC 9110, 15.5.9
	conflict: 409, // RFC 9110, 15.5.10
	gone: 410, // RFC 9110, 15.5.11
	lengthRequired: 411, // RFC 9110, 15.5.12
	preconditionFailed: 412, // RFC 9110, 15.5.13
	requestEntityTooLarge: 413, // RFC 9110, 15.5.14
	requestUriTooLong: 414, // RFC 9110, 15.5.15
	unsupportedMediaType: 415, // RFC 9110, 15.5.16
	requestedRangeNotSatisfiable: 416, // RFC 9110, 15.5.17
	expectationFailed: 417, // RFC 9110, 15.5.18
	teapot: 418, // RFC 9110, 15.5.19 (Unused)
	misdirectedRequest: 421, // RFC 9110, 15.5.20
	unprocessableEntity: 422, // RFC 9110, 15.5.21
	locked: 423, // RFC 4918, 11.3
	failedDependency: 424, // RFC 4918, 11.4
	tooEarly: 425, // RFC 8470, 5.2.
	upgradeRequired: 426, // RFC 9110, 15.5.22
	preconditionRequired: 428, // RFC 6585, 3
	tooManyRequests: 429, // RFC 6585, 4
	requestHeaderFieldsTooLarge: 431, // RFC 6585, 5
	unavailableForLegalReasons: 451, // RFC 7725, 3

	internalServerError: 500, // RFC 9110, 15.6.1
	notImplemented: 501, // RFC 9110, 15.6.2
	badGateway: 502, // RFC 9110, 15.6.3
	serviceUnavailable: 503, // RFC 9110, 15.6.4
	gatewayTimeout: 504, // RFC 9110, 15.6.5
	httpVersionNotSupported: 505, // RFC 9110, 15.6.6
	variantAlsoNegotiates: 506, // RFC 2295, 8.1
	insufficientStorage: 507, // RFC 4918, 11.5
	loopDetected: 508, // RFC 5842, 7.2
	notExtended: 510, // RFC 2774, 7
	networkAuthenticationRequired: 511, // RFC 6585, 6
} as const;
