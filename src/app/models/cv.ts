export class OpenCV {
  Mat;
}

export interface Mat {
  cols: number;
  rows: number;
  data8S: Int8Array;
  data16S: Int16Array;
  data16U: Uint16Array;
  data32F: Float32Array;
  data32S: Int32Array;
  data64F: Float64Array;
  matSize: Array<number>;
  step: Array<number>;
  $$: {
    count: { value: number };
    ptr: number;
    ptrType: any;
  };
}
