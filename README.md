# WSPTG

![57v9o2.jpg](57v9o2.jpg)

Auto enables mining and MSI Afterburner profiles when you're not gaming.

When another process is detected to be competing for significant GPU resources, the miner process is halted.

You can specify the GPU Usage % threshold.

## Usage

Initial setup, just install deps: `$ yarn`

Then you can do
- `$ yarn start` - dev mode
- `$ yarn build` - build exe


## TODOs

- configs (UI / Implementation)
    - ([x] / [ ]) miner path
    - ([x] / [ ]) miner args
    - ([ ] / [ ]) start and stop control
- [ ] visualize whether the miner was started by the manager
- [x] detect if the miner is running
- [ ] start miner exe from UI
- [ ] capture and show miner output in UI
- built application touchups
    - [ ] exe icons
    - [ ] proper title and description
    - [ ] appId
    - [ ] remove window top bar
    - [ ] exe name
- [ ] log to file arg flag
- [ ] suicide on window close
