#!/usr/bin/env node
import * as process from "node:process";
import * as assert from "node:assert";
import * as path from "node:path";
import { parseArgs } from "node:util";
import puppeteer from 'puppeteer';

async function main(args) {
	const { values } = parseArgs({
		args: args.slice(2),
		options: {
			url: {
				type: "string"
			},
			output: {
				type: "string",
				short: "o"
			}
		}
	});

	assert.ok(values.url, "url should be provided")
	assert.ok(values.output, "output should be provided")

	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	await page.goto(values.url, { waitUntil: 'networkidle0' });

	await page.pdf({
		path: path.resolve(values.output),
		format: 'A4',
	});

	await browser.close();
}

void main(process.argv);

