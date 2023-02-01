#!/usr/bin/env bash
set -e

# Configure Python for Web crawling and parsing
python3 -m venv venv
source venv/bin/activate
pip install -U -r requirements.txt

# Configure Rust for publishing tool
cargo install summa-publisher

# Configure NodeJS and NPM for Web part
cd web && npm i && cd ../
