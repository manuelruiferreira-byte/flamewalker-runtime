/* Narrow Drive app-data transport. Tokens are held in memory by the caller. */
(function(root){'use strict';
const C=typeof module==='object'?require('./core-v1.js'):root.ACEUserSync;
const SCOPE='https://www.googleapis.com/auth/drive.appdata',TAG='ace-mind-user-sync-v1';
class DriveError extends Error{constructor(status){super(status===401?'Google session expired. Reconnect to continue.':status===403?'Drive access denied. Check app-data consent and Drive API setup.':status===429?'Drive rate limit. Changes remain pending.':'Drive request failed ('+status+'). Changes remain pending.');this.status=status;}}
class Drive{
 constructor(token,fetcher=(...args)=>fetch(...args)){this.token=token;this.fetcher=fetcher;}
 async request(url,options={}){const r=await this.fetcher(url,{...options,headers:{...options.headers,Authorization:'Bearer '+this.token},cache:'no-store',signal:AbortSignal.timeout(20000)});if(!r.ok)throw new DriveError(r.status);return r.json();}
 async identity(){const d=await this.request('https://www.googleapis.com/drive/v3/about?fields=user(permissionId,emailAddress)');if(!d.user?.permissionId)throw Error('Google account could not be identified.');return d.user;}
 async list(){const files=[];let page='';do{const query=new URLSearchParams({spaces:'appDataFolder',q:"trashed = false and appProperties has { key='aceSync' and value='"+TAG+"' }",fields:'nextPageToken,files(id)',pageSize:'1000'});if(page)query.set('pageToken',page);const d=await this.request('https://www.googleapis.com/drive/v3/files?'+query);files.push(...(d.files||[]));page=d.nextPageToken||'';}while(page);return files;}
 async read(id){const d=await this.request('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media');C.readBatch(d);return d;}
 async append(data){C.readBatch(data);const boundary='ace_'+data.id.replace(/[^a-z0-9]/gi,'');const metadata={name:'ace-sync-'+data.id+'.json',mimeType:'application/json',parents:['appDataFolder'],appProperties:{aceSync:TAG}};
 const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify(data)+'\r\n--'+boundary+'--';
 return this.request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});}
}
const api={Drive,DriveError,SCOPE,TAG};if(typeof module==='object')module.exports=api;else root.ACEDriveTransport=api;
})(globalThis);
