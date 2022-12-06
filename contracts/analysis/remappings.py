'''
Simple script to copy remappings file to slither config file
'''
import json

with open('./remappings.txt', 'r') as f:
    remappings: str = f.read()

items: list[str] = remappings.split('\n')

# truncate blank newline
if items[-1] == '': items = items[:-1]

with open('./slither.config.json', 'r') as j:
    data = json.load(j)

existing_remappings = data.get('solc_remaps')
if existing_remappings and items:
    data['solc_remaps'] = items
    with open('./slither.config.json', 'w') as _of:
        _of.write(json.dumps(data, indent=4))
        print('Mappings written to slither.config.json:', data['solc_remaps'])
