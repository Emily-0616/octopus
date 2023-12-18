✔ Verified with GitKraken v9.5.0 ~ v9.11.0

## 

- [`Gitkraken On-Premise Serverless`](https://www.gitkraken.com/download-on-premise-serverless)(Recommended)
- [`Gitkraken Pro`](https://www.gitkraken.com/download)

## Requirements

- `Node.js` v12 LTS or later
- `yarn`

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


## Disable Automatic Update (Useful only when not using Gitkraken On-Premise Serverless Client)

Add this content to your `hosts` file:

```text
0.0.0.0 release.gitkraken.com
```
