import { Component, HostListener, AfterViewInit } from '@angular/core';
declare var cv: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  opencvReady = false;
  streaming = true;
  src: any;
  dst: any;
  gray: any;
  cap: any;
  faces: any;
  classifier: any;
  video: HTMLElement;
  fps = 1;
  stream: MediaStream;

  ngAfterViewInit() {
    this.video = document.getElementById('videoInput');
  }

  @HostListener('window:opencv-loaded', ['$event'])
  runOpenCV() {
    this.opencvReady = true;
  }

  toggleStream() {
    this.streaming = !this.streaming;

    if (this.streaming) {
      const constraints = {
        audio: false,
        video: true
      };
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream: MediaStream) => {
          this.stream = stream;
          this.streaming = true;
          this.gray = new cv.Mat();
          this.faces = new cv.RectVector();
          this.classifier = new cv.CascadeClassifier();
          (<any>this.video).srcObject = stream;
          // load pre-trained classifiers
          this.classifier.load('./assets/haarcascade_frontalface_default.xml');

          // schedule the first one.
          this.video.onloadedmetadata = (e) => {
            (<any>this.video).play();
            this.src = new cv.Mat(this.video.clientHeight, this.video.clientWidth, cv.CV_8UC4);
            this.dst = new cv.Mat(this.video.clientHeight, this.video.clientWidth, cv.CV_8UC4);
            this.cap = new cv.VideoCapture(this.video);
            setTimeout(this.processVideo, 0);
          };
        })
        .catch(() => {
          this.streaming = false;
        });
    } else {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
    }
  }


  processVideo() {
    try {
      if (!this.streaming) {
        // clean and stop.
        this.src.delete();
        this.dst.delete();
        this.gray.delete();
        this.faces.delete();
        this.classifier.delete();
        return;
      }
      const begin = Date.now();
      // start processing.
      this.cap.read(this.src);
      this.src.copyTo(this.dst);
      cv.cvtColor(this.dst, this.gray, cv.COLOR_RGBA2GRAY, 0);
      // detect faces.
      this.classifier.detectMultiScale(this.gray, this.faces, 1.1, 3, 0);
      // draw faces.
      for (let i = 0; i < this.faces.size(); ++i) {
          const face = this.faces.get(i);
          const point1 = new cv.Point(face.x, face.y);
          const point2 = new cv.Point(face.x + face.width, face.y + face.height);
          cv.rectangle(this.dst, point1, point2, [255, 0, 0, 255]);
      }
      cv.imshow('canvasOutput', this.dst);
      // schedule the next one.
      const delay = 1000 / this.fps - (Date.now() - begin);
      setTimeout(this.processVideo, delay);
    } catch (err) {
      console.error(err);
    }
  }
}
