# include .env file and export its env vars
# (-include to ignore error if it does not exist)
-include .env

all: clean install build

# Clean the repo
clean :; forge clean

# Install the Modules
install :; foundryup && forge install

# Builds
build :; forge build && yarn && yarn prepare

# Allow executable scripts
executable :; chmod +x scripts/*

# create a coverage report (requires lcov (linux) / genhtml (Mac))
coverage :; forge coverage --report lcov && genhtml lcov.info -o report --branch-coverage

# env var check
check-env :; echo $(ETHERSCAN_API_KEY)

# Run the slither container
analyze :; python3 analysis/remappings.py && ./scripts/analyze.sh

#### Deployment scripts ####

deploy-fork :; forge script CounterScript \
    --rpc-url $(RPC) \
    --private-key ${PRIVATE_KEY} \
    --broadcast \
    --slow \
    -vv