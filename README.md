# edgemicro-plugins-volos-cache-memory

This repository contains the volos-cache-memory test code from our [community question.](https://community.apigee.com/questions/38444/cache-lookup-always-fails-on-edge-microgateway-fir.html)

### JavaScript files
There are two files:
1. index.js - my modified version of the original
2. indexorig.js - the original code posted to the community


#### Modifications to index.js
I made the following modifications:
* Moved the create cache out of the `onrequest` method. See above community post for reasons why.
* Added [`async`](https://caolan.github.io/async/) to this code. The reason is that `cache.get()` accepts a function as a callback.  What happens if the callback is called after the `if(tokenValue != null)` condition? It will populate the cache again, which is probably not what you want.
```
if (ssoToken) { //getting from cache'
    cache.get(ssoToken, function(err, val) {
        tokenValue = val
    });
}
if (tokenValue != null) { // cache found. proceed
    console.log('tokenValue found. ' + JSON.stringify(tokenValue));
} else { //setting cache
    cache.set(ssoToken, 'value');
    console.log('putting in cache');
}
```
The modified async version provides a guarantee that the if condition will be executed **after** the callback function completes.  Async is a bit of a misnomer; this was not modified to be asynchronous, however, the async module was used - specifically the `async.waterfall()` function.  
* The last modification was to remove the condition around the following statement.
```
if (ssoToken) { //getting from cache'
    cache.get(ssoToken, function(err, val) {
        tokenValue = val
    });
}
```
changed to
```
...
function(callback) {
  cache.get(key, function(err, val) {
     if(err){
      debug('error is: ' + err);
      tokenValue = null;
    } else {
      //tokenValue = val;
      debug("tokenValue is " + val);
    }
      callback(null, val);
  });
}],
...
```
I think you should check the cache to determine if the key is present.  If it is not present then proceed to populate the cache with the value. If it is present then use the cached value.

* Replaced `console.log()` statements with `debug().`
### Problem Summary
[Volos-cache-memory](https://www.npmjs.com/package/volos-cache-common) works great as a cache, but there is one problem with this in Edge Microgateway.  By default the Microgateway starts in cluster mode based on the number of cores. So if you have a four core CPU, then Microgateway will start 4 processes and each plugin will get its own cache.  If you are ok with this then stop reading.

Here is the sample output of Microgateway running on my machine. Four Microgateway processes are running.
```
3b5c2460-ff5b-11e6-b17b-5932b062db36 edge micro listening on port 8000
3b5b12f0-ff5b-11e6-8108-b92c5e6887df edge micro listening on port 8000
installed plugin from edgemicro-plugins-xml2json
installed plugin from accumulate-response
3b6c7810-ff5b-11e6-8481-ed22f97be8a9 edge micro listening on port 8000
3b6cc630-ff5b-11e6-a6d0-d14638b16c41 edge micro listening on port 8000
```

Here is the output of sending 5 requests to the Edge Micorgateway.  I added a counter variable to keep track of the requests.  Notice that the first four requests display `putting in cache.` The 5th request shows that the item was retrieved from the cache.

**Request 1**
```
plugin:volos-cache-memory on request...1 +0ms
  plugin:volos-cache-memory {"host":"localhost:8000","user-agent":"curl/7.43.0","accept":"*/*"} +1ms
  plugin:volos-cache-memory localhost:8000 +2ms
  plugin:volos-cache-memory tokenValue is undefined +1ms
  plugin:volos-cache-memory setting cache with key and value: /edgemicro_weather/forcastrss: localhost:8000 +0ms
  plugin:volos-cache-memory putting in cache +1ms
  ```
  **Request 2**
  ```
  plugin:volos-cache-memory on request...1 +0ms
  plugin:volos-cache-memory {"host":"localhost:8000","user-agent":"curl/7.43.0","accept":"*/*"} +1ms
  plugin:volos-cache-memory localhost:8000 +1ms
  plugin:volos-cache-memory tokenValue is undefined +1ms
  plugin:volos-cache-memory setting cache with key and value: /edgemicro_weather/forcastrss: localhost:8000 +0ms
  plugin:volos-cache-memory putting in cache +0ms
  ```
  **Request 3**
  ```
  plugin:volos-cache-memory on request...1 +0ms
  plugin:volos-cache-memory {"host":"localhost:8000","user-agent":"curl/7.43.0","accept":"*/*"} +1ms
  plugin:volos-cache-memory localhost:8000 +1ms
  plugin:volos-cache-memory tokenValue is undefined +0ms
  plugin:volos-cache-memory setting cache with key and value: /edgemicro_weather/forcastrss: localhost:8000 +1ms
  plugin:volos-cache-memory putting in cache +0ms
  ```
  **Request 4**
  ```
  plugin:volos-cache-memory on request...1 +0ms
  plugin:volos-cache-memory {"host":"localhost:8000","user-agent":"curl/7.43.0","accept":"*/*"} +1ms
  plugin:volos-cache-memory localhost:8000 +1ms
  plugin:volos-cache-memory tokenValue is undefined +1ms
  plugin:volos-cache-memory setting cache with key and value: /edgemicro_weather/forcastrss: localhost:8000 +1ms
  plugin:volos-cache-memory putting in cache +0ms
  ```
  **Request 5**
  ```
  plugin:volos-cache-memory on request...2 +7s
  plugin:volos-cache-memory {"host":"localhost:8000","user-agent":"curl/7.43.0","accept":"*/*"} +0ms
  plugin:volos-cache-memory localhost:8000 +0ms
  plugin:volos-cache-memory tokenValue is localhost:8000 +0ms
  plugin:volos-cache-memory tokenValue found. localhost:8000 +0ms
```

### Node.js Cluster mode
[Node.js cluster](https://nodejs.org/api/cluster.html#cluster_how_it_works) will use round robin by default, except on Windows machines (get with the program Windows ;) ).  So each process should receive an equal distribution of load from the parent process.


### Setup
1. In order to install the plugin and make sure that you add the plugin to the plugin sequence as shown below.
```
plugins:
   dir: ../plugins
   sequence:
     - edgemicro-plugins-volos-cache-memory
```

2. `cd edgemicro-plugins-volos-cache-memory`

3. Install the node modules
`npm install`

4. Copy the `edgemicro-plugins-volos-cache-memory` plugin folder to the `/usr/local/lib/node_modules/edgemicro/plugins` directory.

```
sudo mkdir /usr/local/lib/node_modules/edgemicro/plugins/edgemicro-plugins-volos-cache-memory
sudo cp -r edgemicro-plugins-volos-cache-memory /usr/local/lib/node_modules/edgemicro/plugins/
```

### Edge Microgateway Configuration file
Note that `oauth` and `quota` are removed in order to test this easily.  However, in production you should include these plugins.  

```
plugins:
  sequence:
    - edgemicro-plugins-volos-cache-memory

```
