import inspector from "node:inspector";

export class Debugger {
	isDebugging: boolean = false;

	start(port = 9229) {
		if (this.isDebugging) {
			console.log('Debug session already running');
			return;
		}

		try {
			inspector.open(port, '0.0.0.0');
			this.isDebugging = true;

			console.log(`Debugger listening on port ${port}`);
			console.log('To connect, open Chrome DevTools and click the Node.js icon or visit chrome://inspect');
		} catch (error) {
			console.error('Failed to start debugger:', error);
		}
	}

	stop() {
		if (!this.isDebugging) {
			console.log('No debug session running');
			return;
		}

		try {
			inspector.close();
			this.isDebugging = false;
			console.log('Debugger stopped');
		} catch (error) {
			console.error('Failed to stop debugger:', error);
		}
	}
}
