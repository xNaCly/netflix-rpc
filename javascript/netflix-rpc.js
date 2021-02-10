const { Client } = require("discord-rpc");
const fetch = require("node-fetch");
const { cookie } = require("./config.json");

var startTimestamp = new Date();

async function reconnect() {
	try {
		await login();
	} catch (error) {
		if (!cookie || cookie == "COOKIEPLACEHOLDER") {
			throw "Cookie missing,\nplease go to https://github.com/xNaCly/netflix-rpc/tree/master/javascript and follow the steps.\n";
		}
		setTimeout(async () => {
			await reconnect();
		}, 1000 * 10);
	}
}

reconnect();

async function send_req() {
	const api_ver = await (await fetch("https://raw.githubusercontent.com/xNaCly/netflix-rpc/master/shakti")).text();
	return api_ver;
}

async function get_history_last() {
	const api_v = await send_req();
	let history = await fetch(`https://www.netflix.com/api/shakti/${api_v.split("\n")[0]}/viewingactivity/`, {
		headers: { cookie },
	});
	history = await history.json();
	return history.viewedItems[0];
}

async function login() {
	const rpc = new Client({
		transport: "ipc",
	});
	item = await get_history_last();

	rpc.on("ready", () => {
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
		}
		rpc.setActivity({
			state: item.title,
			startTimestamp,
			largeImageKey: "logo",
			largeImageText: item.videoTitle,
			smallImageKey: "logo",
			smallImageText: `Progress: ${Math.round(item.bookmark / 60)}/${Math.round(item.duration / 60)}`,
			instance: false,
		});
	});

	rpc.on("disconnected", async () => {
		console.log("disconnected");
		await reconnect();
	});

	rpc.login({ clientId: "740305744116580382" });
	return;
}
