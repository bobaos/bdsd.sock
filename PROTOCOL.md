# Bobaos Datapoint Sdk Message protocol specification

1. Frame format.
All communication should be enveloped in following frame format:
```
|B|D|S|M|<LB>|<LE>|<DATA>|<C>|
```
Where <L> is two byte field in BE that contains length of <DATA>, <C> is checksum of <DATA> (sum of all bytes modulo 256). BDSM(Bobaos Datapoint Sdk Message) is a string header of message.

3. Data protocol description
Field <DATA> is stringified JSON object which shoud match next format in case of Client => Host communication:

```
{
  request_id: Number,
  method: String,
  payload: Object
}

```

* **request_id** field should be unique at the moment of sending and it is responsibility of client to process this value. Server sends responses with this value in response_id field back to client.

* **method** field. 
 *  ```{request_id: id, method: 'get description', payload: {id: number (1-1000)}}```. Response: ```{response_id: number, payload: {id: number (1-1000), value: Object}}```
 *  ```{request_id: id, method: 'get value', payload: {id: number}```. Response: ```{response_id: id, success: Bool, payload: {id: number (1-1000), value: value}}```
 *  ```{request_id: id, method: 'read value', payload: {id: number}}```. Response: ```{response_id: id, success: Bool}```
 *  ```{request_id: id, method: 'set value', payload: {id: number (1-1000), value: value(depends)}}```. response: ```{id: id, success: Bool}```

// TODO: indications 
