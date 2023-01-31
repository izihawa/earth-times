#!/usr/bin/env bash
set -e

python3 -m venv venv
source venv/bin/activate
pip install -U -r requirements.txt
cd web && npm i && cd ../
