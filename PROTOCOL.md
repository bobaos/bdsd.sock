# Bobaos Datapoint Sdk Message protocol specification

1. Frame format.
All communication should be enveloped in following frame format:
```
|B|D|S|M|<LB>|<LE>|<DATA>|<C>|
```
Where \<L\> is two byte field in BE that contains length of \<DATA\>, \<C\> is checksum of \<DATA\> (sum of all bytes modulo 256). BDSM(Bobaos Datapoint Sdk Message) is a string header of message.

# \<DATA\> field description

Field \<DATA\> is stringified JSON object which shoud match next format in case of Client => Host communication:

```
{
  request_id: Number,
  method: String,
  payload: Object // optional
}
```
## Fields explanation

### `request_id`
 
 field should be unique at the moment of sending and it is responsibility of client to process this value. Server sends responses with this value in response_id field back to client.

### `method` field.

#### `get datapoints`

 Get all configured datapoint descriptions.
 
 Request: 

 ```{"request_id":18052831966,"method":"get datapoints"}```

 Response: 

 ```{"response_id":18052831966,"method":"get datapoints","payload":[{"id":1,"length":1,"flags":{"priority":"low","communication":true,"read":false,"write":true,"readOnInit":false,"transmit":true,"update":false},"dpt":"dpt1"},{"id":2,"length":1,"...}]}```

#### `get description`
 
 Get description for datapoint with specified id.
 
 Request: 

 ```{"request_id":145663188249,"method":"get description","payload":{"id":31}}```

 Response: 

 ```{"response_id":145663188249,"method":"get description","payload":{"id":31,"value":{"id":31,"dpt":"dpt5","flags":{"priority":"low","communication":true,"read":false,"write":true,"readOnInit":false,"transmit":true,"update":false},"length":1}},"success":true}```

#### `get value`
 
 Get datapoint value.
 
 Request: 

 ```{"request_id":65362052157,"method":"get value","payload":{"id":31}}```

 Response: 

 ```{"response_id":65362052157,"method":"get value","payload":{"id":31,"value":74},"success":true}```

#### `read value`
 
 Send read request to KNX bus.
 
 Request: 

 ```{"request_id":611387384802,"method":"read value","payload":{"id":31}}```

 Response: 

 ```{"response_id":611387384802,"method":"read value","payload":{"id":31},"success":true}```

#### `set value`

 Set datapoint value and send to KNX bus.
 
 Request:
 
 ```{"request_id":839768583900,"method":"set value","payload":{"id":31,"value":5}}```
 
 Response: 

 ```{"response_id":839768583900,"method":"set value","payload":{"id":31},"success":true}```

#### `programming mode`

 Set programming mode. As if you press PROG button.
 
 Request:
 
 ```{"request_id":1366287859749,"method":"programming mode","payload":{"value":1}}```

 Response: 
 
 ```{"response_id":1366287859749,"method":"programming mode","success":true}```

#### `get stored value`

 Get datapoint value.

 Request:

 ```{"request_id":65362052157,"method":"get stored value","payload":{"id":31}}```

 Response:

 ```{"response_id":65362052157,"method":"get stored value","payload":{"id":31,"value":74},"success":true}```

### `read multiple`

Read multiple datapoints.

Request: ```{"request_id":175279505890,"method":"read multiple","payload":[1,105,106,107,108]}```

Response: ```{"response_id":175279505890,"method":"read multiple","payload":[1,105,106,107,108],"success":true}```

### `set multiple`

Set multiple datapoints

Request: ```{"request_id":1526404778316,"method":"set multiple","payload":[{"id":2,"value":false},{"id":999,"value":"hello, drug"}]}```

Response: ```{"response_id":1526404778316,"method":"set multiple","payload":[{"id":2,"value":false},{"id":999,"value":"hello, drug"}],"success":true}```

## Broadcasting value.

When datapoint value changes on bus, socket broadcasts following data to all connected clients:

```
{"method":"cast value","payload":{"id":12,"value":22.92}}
```

## Notify 

When Client connects to socket, initial notification sends from Host to Client indicating connectino status:

```{"method":"notify","payload":"bus connected"}```

## Error handling

In case of error Host sends to Client data with "success" field set to false and error message in "error" field.

Request: 

```{"request_id":289551154644,"method":"set value","payload":{"id":31,"value":257}}```

Response: 

```{"response_id":289551154644,"method":"set value","success":false,"error":"Value out of range (expected 0-255, got 257)"}```
