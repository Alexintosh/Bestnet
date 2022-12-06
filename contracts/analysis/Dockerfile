FROM ubuntu:22.04

# update packages list
RUN apt-get update

# add pip and solc binaries and add-apt-repository
RUN apt-get install python3-pip software-properties-common curl git -y

# DL solc by adding to apt repository
RUN add-apt-repository ppa:ethereum/ethereum
RUN apt-get update
RUN apt install solc

# adds slither and ability to select solidity compilers
RUN pip3 install slither-analyzer solc-select

# install foundry
RUN curl -L https://foundry.paradigm.xyz | bash
RUN /root/.foundry/bin/foundryup

# Change the working directory
WORKDIR /work
