import asyncio

import aiohttp


class MeduzaClient:
    def __init__(self, url: str):
        self.url = url

    async def retrieve_data(self, params, last_item=None):
        async with aiohttp.ClientSession() as client:
            params['page'] = 0
            params['per_page'] = 100
            while True:
                async with client.get(f'{self.url}/api/v3/search', params=params) as resp:
                    if resp.status != 200:
                        print('wrong response, wait for 5 seconds', resp)
                        await asyncio.sleep(5)
                        continue
                    parsed_response = await resp.json()
                    for document_id in parsed_response['collection']:
                        document = parsed_response['documents'][document_id]
                        document_body = await client.get(f'{self.url}/api/v3/{document["url"]}')
                        document_body = await document_body.json()
                        if document_body['root']['document_type'] in ('episode', 'video'):
                            continue
                        document_body = document_body['root']['content']['body']
                        parsed_document = {
                            'url': document['url'],
                            'title': document['title'],
                            'tags': [document['tag']['name']],
                            'document_type': document['document_type'],
                            'published_at': document['published_at'],
                            'body': document_body,
                            'locale': params['locale'],
                        }
                        if last_item and last_item['url'] == parsed_document['url']:
                            return
                        yield parsed_document
                if not parsed_response['has_next']:
                    return
                params['page'] += 1
