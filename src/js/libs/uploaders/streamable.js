import fs from 'fs';
import request from 'request';
import { log } from '../../../../../../src/core/Logger';
import ReplaysSettingsService from '../../replaysSettingsService';
import {createUploadNotification} from '../../uploads';

function upload(email, password, video, title='untitled') {
  return new Promise((accept, reject) => {
    let thumbPath = `${video.saveDir}/${video.poster}`;

    fs.copyFile(thumbPath, thumbPath.replace('-thumb', '-uthumb'), () => {
      thumbPath = thumbPath.replace('-thumb', '-uthumb');
      console.log(thumbPath);
    });

    let filePath = `${video.saveDir}/${video.path.substring(1)}/${video.fileName}`;
    let size = fs.lstatSync(filePath).size;
    let bytes = 0;
    let notfication = createUploadNotification(video, title);

    let formData = {
      'file': fs.createReadStream(filePath).on('data', (chunk) => {
        notfication.progressbar.style ='width: ' + ((bytes += chunk.length) / size)*100 + '%';
        //console.log(bytes += chunk.length, size);
      }),
      'title': title
    };
  
    let credentials = `${email}:${password}`;
    let authorization = Buffer.from(credentials).toString('base64');
  
    request.post({
      url: 'https://api.streamable.com/upload',
      formData: formData,
      headers: {
        authorization: `Basic ${authorization}`,
      }
    }, function(err, response, body) {
      if (err) {
        log.error(`Error occured during uploading: ${title}`);
        log.error(err);
        notfication.dom.remove();
        alert(`Error occured during uploading: ${title}`);
        reject(err);
      }
      else {
        const data = {
          'title': title,
          'url': 'https://streamable.com/' + JSON.parse(body).shortcode,
          'id': video.id,
          'posterUrl': thumbPath,
          'uploadPlatform': "Streamable",
          'createdTime': new Date(),
        }
        ReplaysSettingsService.addUploadClip(data.url, data);
        notfication.dom.remove();
        accept(data);
      }
    });
  });
}

export default {upload};