# GitCracken
GitKraken utils for non-commercial use

Working on `GNU/Linux` (without `snap`), `Windows` and `macOS`.

✔ Verified with GitKraken v7.7.0 ~ v9.5.1

It should support any newer version of GitKraken, unless the entrypoint code (`src/main/static/startMainProcess.js` of GitKraken source) is modified.

> WARNING! On `macOS` you should patch `GitKraken` only after first launch and full program closing!

## Gitkraken Clients Support & Download

- [`Gitkraken On-Premise Serverless`](https://www.gitkraken.com/download-on-premise-serverless)(Recommended)
- [`Gitkraken Pro`](https://www.gitkraken.com/download)

## Requirements

- `Node.js` v12 LTS or later
- `yarn`

## Usage

- `cd GitCracken/GitCracken/`
- `yarn install`
- `yarn build`
- `node dist/bin/gitcracken.js --help` for more usage information

### Patcher

```bash
$ yarn gitcracken patcher [options] [actions...]
```

`actions` - array of values (any order, any count)

> If `actions` is empty, will be used `auto` mode (ideal for beginners)

| Action   | Description                                 |
|----------|---------------------------------------------|
| `backup` | Backup `app.asar` file                      |
| `unpack` | Unpack `app.asar` file into `app` directory |
| `patch`  | Patch `app` directory                       |
| `pack`   | Pack `app` directory to `app.asar` file     |
| `remove` | Remove `app` directory                      |

| Option            | Description (if not defined, will be used `auto` value)         |
|-------------------|-----------------------------------------------------------------|
| `-a`, `--asar`    | Path to `app.asar` file                                         |
| `-d`, `--dir`     | Path to `app` directory                                         |
| `-f`, `--feature` | Patcher feature (from [patches](patches) dir without extension) |

> You can invoke `-f`, `--feature` several times to apply all patches!

### Examples

`Auto` patch installed `GitKraken` (maybe require `sudo` privileges on `GNU/Linux`) By Default Patch `Pro`

```bash
$ yarn gitcracken patcher
```
`Gitkraken On-Premise Serverless Client` patch

```bash
$ yarn gitcracken patcher -f serverless
```

Use custom path to `app.asar`

```bash
$ yarn gitcracken patcher --asar ~/Downloads/gitkraken/resources/app.asar
```

Use custom `actions` (`backup`, `unpack` and `patch`)

```bash
$ yarn gitcracken patcher backup unpack patch
```

## Notice

### It need to refresh the GitKraken account information after this patch

This patch will modify your license while GitKraken fetching your profile. So if you still got free edition, you should re-login your GitKraken account.

Please ensure the communication with GitKraken server. Somebody may blocked the GitKraken server by the DNS or hosts file, please comment out or remove it temporarily.

If you still got free edition after re-login. Deleting the local profile might help. (Usually the path is `%appdata%\.gitkraken` for Windows, or `~/.gitkraken` for Linux or macOS)

### On macOS you should patch GitKraken after first launch.

There is a quarantine flag while downloading an App from Internet. If you changed it before the first launch, macOS will think the App was broken.

If you already do that, you can execute `sudo xattr -rd com.apple.quarantine /Application/GitKraken.app` to remove quarantine flag.

Search `macos quarantine` for more details.

### This patch only works with GitKraken 7.7.0 and later

## Disable Automatic Update (Useful only when not using Gitkraken On-Premise Serverless Client)

Add this content to your `hosts` file:

```text
0.0.0.0 release.gitkraken.com
```
