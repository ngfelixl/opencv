import { Component, HostListener, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

declare var cv: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  opencvReady = false;
  streaming = false;
  error: string;
  task = 'Loading OpenCV';
  private src: any;
  private dst: any;
  private gray: any;
  private cap: any;
  private faces: any;
  private classifier: any;
  private video: HTMLVideoElement;
  private fps = 30;
  private stream: MediaStream;
  @ViewChild('canvasOutput') canvas: ElementRef;
  context: CanvasRenderingContext2D;
  counter = 0;


  private constraints = {
    audio: false,
    video: true
  };

  ngAfterViewInit() {
    this.video = document.getElementById('videoInput') as HTMLVideoElement;
    this.context = (<HTMLCanvasElement>this.canvas.nativeElement).getContext('2d');
  }

  @HostListener('window:opencv-loaded', ['$event'])
  runOpenCV() {
    this.task = 'OpenCV Ready. Load classifier.';
    this.opencvReady = true;
    this.classifier = new cv.CascadeClassifier();
    this.classifier.load('haarcascade_frontalface_default.xml');
  }

  toggleStream() {
    this.error = '';
    this.streaming = !this.streaming;

    if (this.streaming) {
      this.task = 'Request media device';
      navigator.mediaDevices.getUserMedia(this.constraints)
        .then((stream: MediaStream) => {
          this.task = 'Media device ready';
          this.stream = stream;
          this.gray = new cv.Mat();
          this.faces = new cv.RectVector();
          (<any>this.video).srcObject = stream;

          // schedule the first one.
          this.video.onloadedmetadata = (e) => {
            this.task = 'Metadata loaded. Play video';
            (<any>this.video).play();
            const height = this.video.videoHeight;
            const width = this.video.videoWidth;
            // const height = this.video.clientHeight;
            // const width = this.video.clientWidth;
            // const height = this.video.height;
            // const width = this.video.width;
            // this.video.height = height;
            const ar = height / width;
            const clientWidth = this.video.clientWidth;
            const clientHeight = ar * this.video.clientWidth;
            this.video.width = clientWidth;
            this.video.height = clientHeight;
            console.log(this.video.width, this.video.height);

            this.src = new cv.Mat(clientHeight, clientWidth, cv.CV_8UC4);
            this.dst = new cv.Mat(clientHeight, clientWidth, cv.CV_8UC4);
            // this.context.getImageData(0, 0, width, height);

            this.cap = new cv.VideoCapture(this.video);
            // console.log(this.video.height, this.video.width);
            // this.context.putImageData

            // this.context.canvas.width = this.video.width;
            // this.context.canvas.height = this.video.height;
            this.task = 'Video playing. Setup canvas. Create matrices.';
            this.processVideo();
          };
        })
        .catch((error) => {
          this.error = error;
          this.streaming = false;
        });
    } else {
      if (this.stream) {
        this.task = 'Stopping';
        this.stream.getTracks().forEach(track => track.stop());
      }
    }
  }


  processVideo() {
    this.task = 'Try processing video';
    try {
      this.task = 'Process video';
      if (!this.streaming) {
        this.task = 'Stop streaming. Delete vars.';
        // clean and stop.
        if (this.src) { this.src.delete(); }
        if (this.dst) { this.dst.delete(); }
        if (this.gray) { this.gray.delete(); }
        if (this.faces) { this.faces.delete(); }
        return;
      }
      const begin = Date.now();
      // start processing.
      this.cap.read(this.src);
      this.src.copyTo(this.dst);
      cv.cvtColor(this.dst, this.gray, cv.COLOR_RGBA2GRAY, 0);
      // detect faces.
      // this.classifier.detectMultiScale(this.gray, this.faces, 1.1, 3, 0);
      // draw faces.
      for (let i = 0; i < this.faces.size(); ++i) {
          const face = this.faces.get(i);
          const point1 = new cv.Point(face.x, face.y);
          const point2 = new cv.Point(face.x + face.width, face.y + face.height);
          cv.rectangle(this.dst, point1, point2, [255, 0, 0, 255]);
      }
      cv.imshow(this.canvas.nativeElement, this.dst);
      // schedule the next one.
      const delay = 1000 / this.fps - (Date.now() - begin);

      this.task = `Draw image ${this.counter}`;
      this.counter++;
      setTimeout(() => {
        this.processVideo();
      }, delay);
    } catch (err) {
      this.error = err;
    }
  }
}
