# Bobaos Datapoint Sdk Message protocol specification

1. Frame format.
All communication should be enveloped in following frame format:
```
|B|D|S|M|<L>|<DATA>|<C>|
```
Where <L> is one byte field that contains length of <DATA>, <C> is checksum of <DATA> (sum of all bytes modulo 256). BDSM(Bobaos Datapoint Sdk Message) is a string header of message.

3. Data protocol description
Field <DATA> is stringified JSON object which shoud match next format:

```
{
  id: Number,
  method: String,
  payload: Object
}

```

This requirement applies to all messages both from the Server to Client, and from the Server to Client.

* **id** field should be unique at the moment of sending and it is responsibility of client to 

* **method** field client side
 *  {id: id, method: 'set value', payload {id: number (1-1000), value: value(depends)}}. response: {id: id, success: Bool}
 *  {id: id, method: 'get value', payload {id: number}. response: {id: id, success: Bool, payload: {id: number (1-1000), value: value}}
 *  {id: id, method: 'read value', payload: {id: number}}. response: {id: id, success: Bool}
// TODO: subscribe to indication events
