const { Client } = require("discord-rpc");
const fetch = require("node-fetch");
const { cookie } = require("./config.json");

function logger(content) {
	console.log(`[${new Date().toTimeString().split(" ")[0]}]`, content);
}

var Timestamp = Date.now();
var startTimestamp = new Date();

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function reconnect() {
	logger(`initiating ${__filename}`);
	logger("<cookie> and <api_version> extracted from config");
	logger("-----------------------------------------------");
	try {
		await login();
	} catch (error) {
		console.trace(error);
		if (!cookie || cookie == "COOKIEPLACEHOLDER") {
			throw "Cookie missing,\nplease go to https://github.com/xNaCly/netflix-rpc/tree/master/javascript and follow the steps.\n";
		}
		setTimeout(async () => {
			await reconnect();
		}, 1000 * 10);
	}
	logger("-----------------------------------------------");
}

reconnect();

var api_ver;

async function send_req() {
	api_ver = await fetch("https://raw.githubusercontent.com/xNaCly/netflix-rpc/master/shakti");
	api_ver = await api_ver.text();
	api_ver = api_ver.trim();
}

async function get_profiles() {
	let profiles = await fetch(`https://www.netflix.com/api/shakti/${api_ver}/profiles/`, {
		headers: {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0",
			Accept: "*/*",
			"Accept-Language": "en-US,en;q=0.5",
			"Accept-Encoding": "gzip, deflate, br",
			DNT: 1,
			Connection: "keep-alive",
			Cookie: cookie,
			"Sec-GPC": 1,
			"Cache-Control": "max-age=0",
		},
		method: "GET",
		mode: "cors",
	});
	profiles = await profiles.json();
	return profiles.profiles.map((x) => x.firstName.toUpperCase());
}

async function get_history_last() {
	let history = await fetch(`https://www.netflix.com/api/shakti/${api_ver}/viewingactivity/`, {
		headers: {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0",
			Accept: "*/*",
			"Accept-Language": "en-US,en;q=0.5",
			"Accept-Encoding": "gzip, deflate, br",
			DNT: 1,
			Connection: "keep-alive",
			Cookie: cookie,
			"Sec-GPC": 1,
			"Cache-Control": "max-age=0",
		},
		method: "GET",
		mode: "cors",
	});
	history = await history.json();
	return history.viewedItems[0];
}

async function login() {
	logger(`logging into discord...`);
	const rpc = new Client({
		transport: "ipc",
	});

	logger(`connected to discord... [${(Date.now() - Timestamp) / 1000}ms]`);
	logger("-----------------------------------------------");
	Timestamp = Date.now();
	logger(`logging into netflix...`);
	await send_req();
	const profiles = await get_profiles();
	logger(`connected to netflix... [${(Date.now() - Timestamp) / 1000}ms]`);
	logger(`following profiles detected: ${profiles.join(", ")}`);

	item = await get_history_last();

	rpc.on("ready", async () => {
		while (true) {
			logger(`updating rpc: api/shakti/${api_ver}/viewingactivity/ ...`);
			if (Object.keys(item).includes("seriesTitle")) {
				rpc.setActivity({
					state: item.seriesTitle,
					startTimestamp,
					largeImageKey: "logo",
					largeImageText: item.title,
					smallImageKey: "logo",
					smallImageText: `Progress: ${Math.round(item.bookmark / 60)}/${Math.round(item.duration / 60)}`,
					instance: false,
				});
			} else {
				rpc.setActivity({
					state: item.title,
					startTimestamp,
					largeImageKey: "logo",
					largeImageText: item.videoTitle,
					smallImageKey: "logo",
					smallImageText: `Progress: ${Math.round(item.bookmark / 60)}/${Math.round(item.duration / 60)}`,
					instance: false,
				});
			}

			item = await get_history_last();
			await sleep(15 * 1000);
		}
	});

	rpc.on("disconnected", async () => {
		console.log("disconnected");
		await reconnect();
	});

	rpc.login({ clientId: "740305744116580382" });
	return;
}
