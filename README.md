# WSPTG

![57v9o2.jpg](57v9o2.jpg)

### The Goal

Automatically stop/start mining if you are gaming, and switch MSI Afterburner profiles.

When another process is detected to be competing for significant GPU resources, the miner process is halted.

You can specify the GPU Usage % threshold.

### Current State

A little sad (only a little bit!). Right now it's only a fancy UI to toggle the running state of the miner.

More features will be pushed out, and the exe has auto-updating built in.

## Usage

- download the installer from the [releases page](https://github.com/ferm10n/would-someone-please-think-of-the-gamers/releases). this will auto start the tool, and add a start menu entry to `wsptg.exe`
- provide the path to the miner executable so the tool can tell if it's running
- (optional) provide a start command to run that activates the miner. A good example of this would be the path to a batch script if you're using PheonixMiner. If this isn't set, then the tool assumes it can just start the tool directly without any arguments.

## Development setup

Just install deps: `$ yarn`

Then you can do
- `$ yarn start` - dev mode
- `$ yarn build` - build exe


## TODOs

- configs (UI / Implementation)
    - ([x] / [x]) miner path
    - ([x] / [x]) custom start command
    - ([x] / [x]) start and stop control
- [ ] visualize whether the miner was started by the manager
- [x] detect if the miner is running
- [x] start miner exe from UI
- [ ] capture and show miner output in UI
- built application touchups
    - [ ] exe icons
    - [ ] proper title and description
    - [ ] appId
    - [ ] remove window top bar
    - [x] exe name
- [ ] log to file arg flag
- [ ] toggle advanced options
- [ ] add tested miners in README section
- [ ] kill miner process on exit?
