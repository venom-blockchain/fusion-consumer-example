echo 'INFO: installing and updating dependencies'
sudo apt update && sudo apt upgrade
sudo apt install build-essential llvm clang pkg-config libssl-dev libsasl2-dev

echo 'INFO: installing Rust'
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

echo 'INFO: installing Protobuf Compiler'
apt install -y protobuf-compiler

echo 'INFO: installing node js'
sudo apt install nodejs npm

echo 'Update node to latest version'
sudo npm install -g n
sudo n stable