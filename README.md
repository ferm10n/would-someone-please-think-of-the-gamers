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

- [ ] icons?
- [ ] start miner exe from UI
- [ ] capture and show miner output in UI
- built application touchups
    - [ ] proper title and description
    - [ ] appId
    - [ ] remove window top bar
    - [ ] exe name