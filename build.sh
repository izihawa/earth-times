#!/usr/bin/env bash
set -e

cd web && npm i && npm run build-only && cd ../
data_cid=$(python3 update.py)
cid=$(summa-publisher publish -s 0.0.0.0:4402 -r web/dist -d "meduza:$data_cid")
echo "Open in browser: http://$cid.ipfs.localhost:8080"

ipfs pin add "$cid"

ipfs pin remote add --service=Filebase --name=meduza_"$cid" "$cid"

# ipfs pin remote add --service=Web3_Storage --name=meduza "$cid"
ipfs name publish --key=meduza "$cid"
