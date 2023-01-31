import asyncio
import json
from contextlib import suppress

from aiosumma import SummaClient
from clients.meduza import MeduzaClient
import yaml


async def create_if_not_exist(summa_client, schema_name):
    with open(schema_name) as f:
        schema = yaml.safe_load(f.read())
    with suppress(Exception):
        await summa_client.create_index(**schema)
    return schema['index_name']


async def get_last_items(summa_client, index_name, locale):
    request_for_last_items = await summa_client.search([{
        'index_alias': index_name,
        'query': {'term': {'field': 'locale', 'value': locale}},
        'collectors': [{'top_docs': {'limit': 1, 'scorer': {'order_by': 'published_at'}}}],
    }], ignore_not_found=True)
    last_items = request_for_last_items.collector_outputs[0].top_docs.scored_documents
    if len(last_items) > 0:
        return json.loads(last_items[0].document)


async def main():
    m_client = MeduzaClient('https://meduza.io')
    summa_client = SummaClient('0.0.0.0:8082', connection_timeout=5.0)
    await summa_client.start()
    index_name = await create_if_not_exist(summa_client, 'configs/meduza_schema.yaml')
    has_changed = False
    for locale in ['en', 'ru']:
        last_item = await get_last_items(summa_client, index_name, locale)
        async for item in m_client.retrieve_data(params={'chrono': 'news', 'locale': locale}, last_item=last_item):
            await summa_client.index_document(index_name, item)
            has_changed = True
    if has_changed:
        await summa_client.commit_index(index_name, 'Sync')
    cid = (await summa_client.get_index(index_name)).index.index_engine.ipfs.cid
    print(cid)

asyncio.run(main())
