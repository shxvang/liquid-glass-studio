import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import styles from './App.module.scss';
import { createProgram, createShader } from './utils/GLUtils';
import { ResizableWindow } from './components/ResizableWindow';
import type { ResizeWindowCtrlRefType } from './components/ResizableWindow/ResizableWindow';

import VertexShader from './shaders/vertex.glsl?raw';
import FragmentShader from './shaders/fragment.glsl?raw';
import { useResizeObserver } from './utils/useResizeOberver';
import clsx from 'clsx';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasInfo, setCanvasInfo] = useState<{ width: number; height: number; dpr: number }>({
    width: 1300,
    height: 1300,
    dpr: 1,
  });
  const stateRef = useRef<{
    canvasWindowCtrlRef: ResizeWindowCtrlRefType | null;
    renderRaf: number | null;
    canvasInfo: typeof canvasInfo;
    glStates: {
      gl: WebGL2RenderingContext;
      program: WebGLProgram;
      vao: WebGLVertexArrayObject;
    } | null;
    canvasPos: { x: number; y: number };
    canvasPointerPos: { x: number; y: number };
  }>({
    canvasWindowCtrlRef: null,
    renderRaf: null,
    glStates: null,
    canvasInfo,
    canvasPos: {
      x: 0,
      y: 0,
    },
    canvasPointerPos: {
      x: 0,
      y: 0,
    },
  });
  stateRef.current.canvasInfo = canvasInfo;

  const centerizeCanvasWindow = useCallback(() => {
    const ctrl = stateRef.current.canvasWindowCtrlRef;
    if (!ctrl) {
      return;
    }
    const size = ctrl.getSize();
    ctrl.setMoveOffset({
      x: window.innerWidth / 2 - size.width / 2,
      y: window.innerHeight / 2 - size.height / 2,
    });
  }, []);

  useLayoutEffect(() => {
    const onResize = () => {
      centerizeCanvasWindow();
      setCanvasInfo((v) => ({
        ...v,
        dpr: window.devicePixelRatio,
      }));
    };
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useLayoutEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    canvasRef.current.width = canvasInfo.width * canvasInfo.dpr;
    canvasRef.current.height = canvasInfo.height * canvasInfo.dpr;
  }, [canvasInfo]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvasEl = canvasRef.current;
    const onPointerMove = (e: PointerEvent) => {
      // stateRef.current.canvasPointerPos.x = e.clientX;
      const canvasInfo = stateRef.current.canvasInfo;
      if (!canvasInfo) {
        return;
      }
      stateRef.current.canvasPointerPos = {
        x: (e.clientX - stateRef.current.canvasPos.x) * canvasInfo.dpr,
        y: (stateRef.current.canvasInfo.height - (e.clientY - stateRef.current.canvasPos.y)) * canvasInfo.dpr,
      };
      // console.log(stateRef.current.canvasPos.x, stateRef.current.canvasPos.y);
    };
    canvasEl.addEventListener('pointermove', onPointerMove);

    const gl = canvasEl.getContext('webgl2');
    if (!gl) {
      return;
    }

    // 创建shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FragmentShader);

    if (!vertexShader || !fragmentShader) {
      return;
    }

    // 创建program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      return;
    }

    // 输入用户绘制的数据
    // 创建buffer
    const positionBuffer = gl.createBuffer();
    // 绑定到全局的 gl.ARRAY_BUFFER 绑定点上，供后续操作
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // 往Buffer上存放数据
    const positionData = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);

    // 创建buffer
    const vcolorBuffer = gl.createBuffer();
    // 绑定到全局的 gl.ARRAY_BUFFER 绑定点上，供后续操作
    gl.bindBuffer(gl.ARRAY_BUFFER, vcolorBuffer);
    // 往Buffer上存放数据
    const vcolorData = new Uint8Array([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vcolorData, gl.STATIC_DRAW);

    //创建VAO
    // VAO，属性状态的集合，可以保存一堆 attributes （定义了buffer如何被访问）
    const vao = gl.createVertexArray();
    // 绑定到全局的 VERTEX_ARRAY_BINDING 绑定点上，供后续操作
    gl.bindVertexArray(vao);

    // 设置attribute对应的数据和数据读取方式
    // 获取属性（attribute）的索引号。使用索引号来引用到GPU维护的属性列表中
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    // 获取uniform的索引号
    const uResolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const uMouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const uTimeLocation = gl.getUniformLocation(program, 'u_time');

    // 激活该index下的属性以便使用
    gl.enableVertexAttribArray(positionAttributeLocation);
    // 这里前序已经操作过了，可以不做。但是如果被改变了，这里需调整回来
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // 告诉显卡，这个attribute如何 读取和使用 当前在 gl.ARRAY_BUFFER 上对应的buffer数据
    // 相关信息存储在VAO（的attributes）中
    gl.vertexAttribPointer(
      positionAttributeLocation, // index: attribute索引号
      2, // size: 每次vertex shader迭代，所使用的buffer元素数量，这里是2个值（x，y坐标）
      gl.FLOAT, // type: 值类型
      false, // normalized: 是否normalize（归一化），例如gl.BYTE类型（-128～127）将转换为[-1, 1], gl.UNSIGNED_BYTE 转换为[0, 1]
      0, // stride：buffer中每次迭代跳过的数据偏移量。为0则为紧密打包的。
      0, // offset: 顶点数组的第一个部分的字节偏移量。必须是字节长度的倍数
    );

    // 获取属性（attribute）的索引号。使用索引号来引用到GPU维护的属性列表中
    const vcolorAttributeLocation = gl.getAttribLocation(program, 'a_color');
    // 激活该index下的属性以便使用
    gl.enableVertexAttribArray(vcolorAttributeLocation);
    // 这里前序已经操作过了，可以不做。但是如果被改变了，这里需调整回来
    gl.bindBuffer(gl.ARRAY_BUFFER, vcolorBuffer);
    // 告诉显卡，这个attribute如何 读取和使用 当前在 gl.ARRAY_BUFFER 上对应的buffer数据
    // 相关信息存储在VAO（的attributes）中
    gl.vertexAttribPointer(
      vcolorAttributeLocation, // index: attribute索引号
      4, // size: 每次vertex shader迭代，所使用的buffer元素数量，这里是2个值（x，y坐标）
      gl.UNSIGNED_BYTE, // type: 值类型
      true, // normalized: 是否normalize（归一化），例如gl.BYTE类型（-128～127）将转换为[-1, 1], gl.UNSIGNED_BYTE 转换为[0, 1]
      0, // stride：buffer中每次迭代跳过的数据偏移量。为0则为紧密打包的。
      0, // offset: 顶点数组的第一个部分的字节偏移量。必须是字节长度的倍数
    );

    // // 现在，各种状态值准备就绪
    // // 可以启用program了，此时program能够通过VAO读取顶点相关的attributes和buffer
    // // 传入link好的shader中进行处理和绘制了
    // gl.useProgram(program);
    // //
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
    stateRef.current.glStates = {
      gl,
      program,
      vao,
    };

    let raf: number | null = null;
    const render = (t: number) => {
      raf = requestAnimationFrame(render);
      if (!stateRef.current.glStates) {
        return;
      }

      const { gl, program, vao } = stateRef.current.glStates;
      const { canvasInfo } = stateRef.current;

      gl.viewport(
        0,
        0,
        Math.round(canvasInfo.width * canvasInfo.dpr),
        Math.round(canvasInfo.height * canvasInfo.dpr),
      );

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program);

      gl.bindVertexArray(vao);
      gl.uniform2f(
        uResolutionLocation,
        Math.round(canvasInfo.width * canvasInfo.dpr),
        Math.round(canvasInfo.height * canvasInfo.dpr),
      );
      // console.log(canvasInfo)
      gl.uniform2f(uMouseLocation, stateRef.current.canvasPointerPos.x, stateRef.current.canvasPointerPos.y);
      // gl.uniform1f(timeUniformLocation, t / 1000);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(render);

    return () => {
      canvasEl.removeEventListener('pointermove', onPointerMove);
      if (raf) {
        cancelAnimationFrame(raf);
      }
    };
  }, []);

  return (
    <>
      <ResizableWindow
        disableMove
        size={canvasInfo}
        onResize={(size) => {
          setCanvasInfo({
            ...size,
            dpr: window.devicePixelRatio,
          });
          centerizeCanvasWindow();
        }}
        onMove={(pos) => {
          stateRef.current.canvasPos = pos;
        }}
        ctrlRef={(ref) => {
          stateRef.current.canvasWindowCtrlRef = ref;
        }}
      >
        <div className={clsx(styles.canvasContainer)}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            style={
              {
                ['--dpr']: canvasInfo.dpr,
              } as CSSProperties
            }
          />
        </div>
      </ResizableWindow>
    </>
  );
}

export default App;
