import * as os from "os";
import * as path from "path";

import * as NodeRSA from "node-rsa";
import * as asar from "asar";
import * as diff from "diff";
import * as fs from "fs-extra";
import natsort from "natsort";
import * as tar from "tar";
import * as utils from "./utils";

import {baseDir} from "../global";
import {CURRENT_PLATFORM, Platforms} from "./platform";


// Patcher options
export interface IPatcherOptions 
{
	// app.asar file
	readonly asar?: string;

	// app directory
	readonly dir?: string;
	
	// Patcher features
	readonly features: string[];
}

// Patcher
export class Patcher 
{
	private static findAsarUnix(...files: string[]): string | undefined 
	{
		return files.find((file) => fs.existsSync(file));
	}

	private static findAsarLinux(): string | undefined 
	{
		return Patcher.findAsarUnix(
			"/opt/gitkraken/resources/app.asar", // Arch Linux
			"/usr/share/gitkraken/resources/app.asar", // deb & rpm
		);
	}

	private static findAsarWindows(): string | undefined 
	{
		const gitkrakenLocal = path.join(os.homedir(), "AppData/Local/gitkraken");
		if (!fs.existsSync(gitkrakenLocal)) 
		{
			return undefined;
		}
		const apps = fs.readdirSync(gitkrakenLocal).filter((item) => item.match(/^app-\d+\.\d+\.\d+$/));
		let app = apps.sort(natsort({desc: true}))[0];
		if (!app) 
		{
			return undefined;
		}
		app = path.join(gitkrakenLocal, app, "resources/app.asar");
		return fs.existsSync(app) ? app : undefined;
	}

	private static findAsarMacOS(): string | undefined 
	{
		return Patcher.findAsarUnix("/Applications/GitKraken.app/Contents/Resources/app.asar");
	}
	

	private static findAsar(dir?: string): string | undefined 
	{
		if (dir) 
		{
			return path.normalize(dir) + ".asar";
		}
		switch (CURRENT_PLATFORM) 
		{
			case Platforms.linux:
				return Patcher.findAsarLinux();
			case Platforms.windows:
				return Patcher.findAsarWindows();
			case Platforms.macOS:
				return Patcher.findAsarMacOS();
		}
	}

	private static findDir(asarFile: string): string 
	{
		return path.join(path.dirname(asarFile), path.basename(asarFile, path.extname(asarFile)));
	}

	private readonly _asar: string;
	private readonly _dir: string;
	private readonly _features: string[];

	// Patcher constructor
	// @param options Options
	public constructor(options: IPatcherOptions) 
	{
		const maybeAsar = options.asar || Patcher.findAsar(options.dir);
		if (!maybeAsar) 
		{
			throw new Error("Can't find app.asar!");
		}
		this._asar = maybeAsar;
		this._dir = options.dir || Patcher.findDir(this.asar);
		this._features = options.features;
		if (!this.features.length) 
		{
			throw new Error("Features is empty!");
		}
	}

	// app.asar file
	public get asar(): string 
	{
		return this._asar;
	}
	
	// app directory
	public get dir(): string 
	{
		return this._dir;
	}

	// Patcher features
	public get features(): string[] 
	{
		return this._features;
	}

	// Backup app.asar file
	// @throws Error
	public backupAsar(): string 
	{
		const backup = `${this.asar}.${new Date().getTime()}.backup`;
		fs.copySync(this.asar, backup);
		return backup;
	}

	// Unpack app.asar file into app directory
	// @throws Error
	public unpackAsar(): void 
	{
		asar.extractAll(this.asar, this.dir);
	}

	// Pack app directory to app.asar file
	// @throws Error
	public packDirAsync(): Promise<void> 
	{
		return asar.createPackage(this.dir, this.asar);
	}

	// Remove app directory
	// @throws Error
	public removeDir(): void 
	{
		fs.removeSync(this.dir);
	}

	// Patch app directory
	// @throws Error
	public patchDir(): void 
	{
		for (const feature of this.features) 
		{
			console.log("Patching feature: " + feature);
			switch (feature) 
			{
				case "serverless":
					this.patchDirWithServerless();
					break;

				case "pro":
					this.patchDirWithPro();
					break;

				default:
					this.patchDirWithFeature(feature);
					break;
			}
		}
	}

	public patchDirWithServerlessChoices() : Promise<void> 
	{
		const readline = require('readline').createInterface(
		{
			input: process.stdin,
			output: process.stdout
		});
		
		console.log("1. Generate license");
		console.log("2. Exit");
		readline.question(`Enter your choice: `, (choice: string) => 
		{
			readline.close();
			switch (choice)
			{
				case "1":
					this.GenerateLicense();
					break;
				case "2":
					break;
				default:
					console.log("Invalid choice");
					break;
			}
		});
		return new Promise<void>((resolve) => resolve());
	}

	private GenerateLicense(): void
	{
		const privateKey = "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQ0KTUlJRW93SUJBQUtDQVFFQXVncWpCWGFyWGt6MXBuZDNDcXhtQVIxNEg2cE1nTkVFUXlra2xoK3NFdjduZ1hkcw0Kb2V1ekwwell4TmdpeWQveExSZ2dmeTVIdEJZaEZsV2tIbnBxaW4vYTlzRjExS1JCR3FmcTUvVnFGWWJBVE9WNg0KZENPWFdQTjY4cFYvSHlqRnlwUDRkOTNlL3lERjNLQVNPd0ttOStLUDk3TTVEUm1NNWxaUkE5RmdSYVBDOFUxeA0KRmoxNDhTOGUxczhGMHMrTzRFNE9YeXk2cVBuYmN5akhXSERZNUVPNjI1VVBlb2I4T21VcEROWmJMZExHZmhtSQ0Ka1NYWXhEamRId1hVUDZuSFJQUHZmY2s4UDhYY2krOG1tRVRmRnhZaU1BVHN0SVZTZUxWd21MN2FuU2hqL0greg0KQk1IQ1ZVeit4T0lVTDd2d3hkdXQyWTRsZk5Yb3psZGdINGYwZFFJREFRQUJBb0lCQUVNM0lKc1N1dXVCSnFlVQ0KTmdBM05VdGwyRWFvZ3FkdjNQaGUzd2NXUGxkR25XSGJRZlptY0FEQTVQaUpsbGdWZnM5cURpT2xGdWJycjl5Zg0KNklIU2ZMZTVaZVVORklOVkxPaHlqcDVydm40MGh6bkJGekxxd1AyMFNsRm16ZHoySURBR3NoaXNvcXJPcm0zOQ0KcjFoK3B0Q2NuS05EcjNNYUxodnlSNmIzZUs3djFBTTA1QWl3dzlOeUkzVWZJQ0VaU2JvU01Tc0sra1ZjN3NHYg0KS1BkWGNPd1dRZG1uRDFCQVZxRDU3THF3aW56Uld1ZGt2TWREbnJhNCtKbnBINU5xVFgrWitOTldIbEJkRjBNOA0KcjZpUGtBR21EYVRUWE1NeTZsRTNVZUpTV0Z5a005YjVESzMrQ1cvNWhKdzJpQnladnRwaHdTQ3BORVp3c3F5cA0KUzcwQW4wRUNnWUVBM1NKYjdxSVhQWTlwcTMvNmd5SHpYOGFDVGJlQ3BzdTNWVW03U1h1c2xTNzd6TnNTTDZqVQ0Kai9VMWQ1UmJvUHR6Y3EvZmtCRTFzSVYvZEZRSTV5WVlFYmFHdlpnYytQUkNWMGZLVDE1Rm0zbjNpOUV5ME14Tw0KT3o0dkhWV0xvY3M0dUtERWFqRDRlWThXUDlMMnc2aHZaUGgyeGpRMmZ5V1dFU0ZROFhIRW9nMENnWUVBMTEvVg0KRlR6NnNzakpLUFpucFFFOW9jYmU4TmNheVZNWU9qRmRTaHl1WVBLNDJSZlZSVk80OXg4d0czWk5wcjRhMDhsaQ0KL1EveUt4NEM2aTJZQ1dZdXI0QzVGcTVEYjZrOGVFOXBDQW52eG8xZ2dOaDJuK21FSG1KeURWdVd2MDZuZHFZMg0KK1crMGlDeVJwUC93d3BvQlBNOThMVS9ua0xpaGdPaHMwS2JBeWdrQ2dZQUpFUUtSNnlWbXliMThZWmZrem55Sw0KL2JtVDlDVXdMNFFKeENjZ29TaDNTV0RiaWxQWmptT0FyMzRNdEJGNXJUV1RpekJ3V0xSSjAzOWhScHpDMVdZQg0KTyttVVZtdEJyY29XaUFQOGN4SUppTnVrYU9SYmVUVHY2dUhGb3g5QmQvS1FaMDhHUjVHNGNpeG9XMzd3a0xSWQ0KZ0hObU52ZlJDTHA1WTFOTlF1dmI5UUtCZ0drTm5xTklaa1NVdWNKWVJuL3UxZ0EyUUFLYitiM2Y0VDVwVzhiTg0KcktVdlg4ak0za045cmdna1YxUGQ1Y3lDaUJWcjh2UGJObFdmd3U0MUpTYlloOGNsYzZMRGg3Tk1pbWxvMnFPSQ0KTFVQZExBaE5EYmU4c0t3ZGV1SlhIWFhkU01RUUdWcWNDU1F2RVMrNWc5ZDRSVWhETUovdGpOZERwOHQ0RTdQRw0KMHR6NUFvR0JBS2JrSm5XOUVzRWp5d0VoOVZyWGIrdWJkbHFnSmgraE9WMmVwVHVJZnJKT0x6d0Z6YjJjRXdMSw0KNnoySmMxeCs5T1Yya2RaR2JoUjlVbFBtdjhNdExndVg3LzAwcEt4RUJZZDBzeTl3WithOTV0bnRVeUF0ZzBDeQ0Kbmg2NDVxWjlvVzlZSWxsU3FNSFZ6SUJadFc3a3IyclhSditLZnZCcXJLODhmWXdwYjNMbg0KLS0tLS1FTkQgUlNBIFBSSVZBVEUgS0VZLS0tLS0=";

		const readline = require('readline').createInterface(
		{
			input: process.stdin,
			output: process.stdout
		});
			
		readline.question(`Enter your name: `, (name: string) => 
		{
			readline.question(`Enter quantity of licenses: `, (quantity: string) => 
			{
				readline.close();
				if (!name)
					name = "SS";
				if (!quantity)
					quantity = Number.MAX_SAFE_INTEGER.toString();
				const license = `{"subscriber":{"name":"${name}"},"quantity": ${quantity},"expiresAt":1982386747999999}`;
				this.enc_phase1(Buffer.from(privateKey, "base64").toString("utf8"), license);
			});
		});
	}

	private async enc_phase1(privateKey: any, LicenseData: any): Promise<void>
	{
		let key = new NodeRSA();
		key.importKey(privateKey, "private");

		let license = key.encryptPrivate(LicenseData, 'binary', "utf8");
		let setBlocks = async (data: any) =>
		{
			let bdata = Buffer.from(data, "binary");
			fs.mkdirSync('./blocks', { recursive: true });
			fs.writeFileSync("./blocks/0", bdata);
			let archive = await tar.create(
			{
				gzip: true,
				file: 'license.dat',
				// cwd: '/',
				// portable: true,
				strict: true,
				// noDirRecurse: true,
				// noPax: true,
				// noMtime: true,
				// noSort: true,
				// path: 'blocks/0',
				// filter: (_path, _stat) => true
			}, ['blocks']);
		};
		let reverseLicense = async () =>
		{
			fs.removeSync('./blocks');
			let dataToReverse = fs.readFileSync("./license.dat");
			let K = utils.reverseBuffer(dataToReverse);
			fs.writeFileSync("./license.dat", K);
		}
		await setBlocks(license);
		reverseLicense();
	}

	private patchDirWithServerless() : void
	{
		const bundlePath = path.join(this.dir, "src/main/static/main.bundle.js");
		
		const patchedPattern = "LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0NCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBdWdxakJYYXJYa3oxcG5kM0NxeG0NCkFSMTRINnBNZ05FRVF5a2tsaCtzRXY3bmdYZHNvZXV6TDB6WXhOZ2l5ZC94TFJnZ2Z5NUh0QlloRmxXa0hucHENCmluL2E5c0YxMUtSQkdxZnE1L1ZxRlliQVRPVjZkQ09YV1BONjhwVi9IeWpGeXBQNGQ5M2UveURGM0tBU093S20NCjkrS1A5N001RFJtTTVsWlJBOUZnUmFQQzhVMXhGajE0OFM4ZTFzOEYwcytPNEU0T1h5eTZxUG5iY3lqSFdIRFkNCjVFTzYyNVVQZW9iOE9tVXBETlpiTGRMR2ZobUlrU1hZeERqZEh3WFVQNm5IUlBQdmZjazhQOFhjaSs4bW1FVGYNCkZ4WWlNQVRzdElWU2VMVndtTDdhblNoai9IK3pCTUhDVlV6K3hPSVVMN3Z3eGR1dDJZNGxmTlhvemxkZ0g0ZjANCmRRSURBUUFCDQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0=";
		
		const pattern1 = /const [^=]*="LS0tLS1CRUdJTi[\w+/=]+",/; // LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJ
		const searchValue = new RegExp(`(${pattern1.source})`);
		const sourceData = fs.readFileSync(bundlePath, "utf-8");
		const replaceValue = sourceData.match(searchValue)![0].replace(/"([^"]*)"/g, "\"LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0NCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBdWdxakJYYXJYa3oxcG5kM0NxeG0NCkFSMTRINnBNZ05FRVF5a2tsaCtzRXY3bmdYZHNvZXV6TDB6WXhOZ2l5ZC94TFJnZ2Z5NUh0QlloRmxXa0hucHENCmluL2E5c0YxMUtSQkdxZnE1L1ZxRlliQVRPVjZkQ09YV1BONjhwVi9IeWpGeXBQNGQ5M2UveURGM0tBU093S20NCjkrS1A5N001RFJtTTVsWlJBOUZnUmFQQzhVMXhGajE0OFM4ZTFzOEYwcytPNEU0T1h5eTZxUG5iY3lqSFdIRFkNCjVFTzYyNVVQZW9iOE9tVXBETlpiTGRMR2ZobUlrU1hZeERqZEh3WFVQNm5IUlBQdmZjazhQOFhjaSs4bW1FVGYNCkZ4WWlNQVRzdElWU2VMVndtTDdhblNoai9IK3pCTUhDVlV6K3hPSVVMN3Z3eGR1dDJZNGxmTlhvemxkZ0g0ZjANCmRRSURBUUFCDQotLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0=\"");
		const sourcePatchedData = sourceData.replace(searchValue, replaceValue);
		if (sourceData === sourcePatchedData)
		{
			if (sourceData.indexOf(patchedPattern) < 0)
				throw new Error("Can't patch pro features, pattern match failed. Get support from https://t.me/gitkrakencrackchat");
			throw new Error("It's already patched.");
		}
		fs.writeFileSync(bundlePath, sourcePatchedData, "utf-8");
	}

	private patchDirWithPro(): void 
	{
		const bundlePath = path.join(this.dir, "src/main/static/main.bundle.js");

		const patchedPattern ='(delete json.proAccessState,delete json.licenseExpiresAt,json={...json,licensedFeatures:["pro"]});';

		const pattern1 = /const [^=]*="dev"===[^?]*\?"[\w+/=]+":"[\w+/=]+";/;
		const pattern2 = /return (JSON\.parse\(\([^;]*?\)\(Buffer\.from\([^;]*?,"base64"\)\.toString\("utf8"\),Buffer\.from\([^;]*?\.secure,"base64"\)\)\.toString\("utf8"\)\))\};/;
		const searchValue = new RegExp(`(?<=${pattern1.source})${pattern2.source}`);
		const replaceValue =
			"var json=$1;" +
			'("licenseExpiresAt"in json||"licensedFeatures"in json)&&' +
			'(delete json.proAccessState,delete json.licenseExpiresAt,json={...json,licensedFeatures:["pro"]});' +
			"return json};";

		const sourceData = fs.readFileSync(bundlePath, "utf-8");
		const sourcePatchedData = sourceData.replace(searchValue, replaceValue);
		if (sourceData === sourcePatchedData) 
		{
			if (sourceData.indexOf(patchedPattern) < 0)
			throw new Error("Can't patch pro features, pattern match failed. Get support from https://t.me/gitkrakencrackchat");
			throw new Error("It's already patched.");
		}
		fs.writeFileSync(bundlePath, sourcePatchedData, "utf-8");
	}

	private patchDirWithFeature(feature: string): void 
	{
		const patches = diff.parsePatch(fs.readFileSync(path.join(baseDir, "patches", `${feature}.diff`), "utf8"));
		for (const patch of patches) 
		{
			this.patchDirWithPatch(patch);
		}
	}

	private patchDirWithPatch(patch: diff.ParsedDiff): void 
	{
		const sourceData = fs.readFileSync(path.join(this.dir, patch.oldFileName!), "utf8");
		const sourcePatchedData = diff.applyPatch(sourceData, patch);
		if ((sourcePatchedData as any) === false) 
		{
			throw new Error(`Can't patch ${patch.oldFileName}`);
		}
		if (patch.oldFileName !== patch.newFileName) 
		{
			fs.unlinkSync(path.join(this.dir, patch.oldFileName!));
		}
		fs.writeFileSync(path.join(this.dir, patch.newFileName!), sourcePatchedData, "utf8");
	}
}
