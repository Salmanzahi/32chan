# Code Citations

## License: Apache_2_0
https://github.com/firebase/snippets-web/tree/d781c67b528afe99fcdb7c7056104772463fa3ec/snippets/storage-next/upload-files/storage_monitor_upload.js

```
on('state_changed', 
            (snapshot) => {
                // Observe state change events such as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress = (snapshot.bytesTransferred /
```


## License: unknown
https://github.com/kjohn01/Airspace/tree/328090c3117cbc99a3dbb2d0ad6da4c8f6241294/src/scripts/database.js

```
uploadTask.on('state_changed', 
            (snapshot) => {
                // Observe state change events such as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress = (snapshot.
```


## License: unknown
https://github.com/kmcq/rise-www/tree/7a79b9016499c4fcff69a8e1526c1a641cf88434/src/reducers/firebase.js

```
as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '
```


## License: unknown
https://github.com/arieltraut/lab4-1er-parcial-peliculas/tree/8f0dc3eb9a0c72ce9f2aa9cbf09a6983278cec4b/src/app/componentes/actor-modificar/actor-modificar.component.ts

```
task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            }, 
            (error)
```


## License: unknown
https://github.com/sebaaguirre2012/PPS-2020/tree/fc85da8ceafbab4df4eb6d18f05c28ffd4fcc68a/Apps/la-vecindad/src/app/gallery/list/new-post/new-post.page.ts

```
of bytes uploaded and the total number of bytes to be uploaded
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            }, 
            (error) => {
                // Handle
```

