import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import styles from './App.module.scss';
import { loadTextureFromURL, MultiPassRenderer } from './utils/GLUtils';
import { ResizableWindow } from './components/ResizableWindow';
import type { ResizeWindowCtrlRefType } from './components/ResizableWindow/ResizableWindow';

import VertexShader from './shaders/vertex.glsl?raw';
import FragmentBgShader from './shaders/fragment-bg.glsl?raw';
import FragmentBgVblurShader from './shaders/fragment-bg-vblur.glsl?raw';
import FragmentBgHblurShader from './shaders/fragment-bg-hblur.glsl?raw';
import FragmentMainShader from './shaders/fragment-main.glsl?raw';
import { Controller } from '@react-spring/web';

import { useResizeObserver } from './utils/useResizeOberver';
import clsx from 'clsx';
import { useControls, folder, Leva } from 'leva';
import { computeGaussianKernelByRadius } from './utils';
import { LevaVectorNew } from './components/LevaVectorNew/LevaVectorNew';
import { LevaImageUpload } from './components/LevaImageUpload/LevaImageUpload';
import { LevaContainer } from './components/LevaContainer/LevaContainer';

import bgBarH from '@/assets/bg-bar-h.png';
import bgHalf from '@/assets/bg-half.png';
import bgGrid from '@/assets/bg-grid.png';
import bgTimcook from '@/assets/bg-timcook.png';
import bgTahoeLightImg from '@/assets/bg-tahoe-light.webp';
import bgTahoeDarkImg from '@/assets/bg-buildings.png';

import languages from './utils/languages';
import { LevaCheckButtons } from './components/LevaCheckButtons';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasInfo, setCanvasInfo] = useState<{ width: number; height: number; dpr: number }>({
    width: Math.max(Math.min(window.innerWidth, window.innerHeight) - 100, 600),
    height: Math.max(Math.min(window.innerWidth, window.innerHeight) - 100, 600),
    dpr: 1,
  });

  // detect system language
  console.log(navigator.language);

  const [langName, setLangName] = useState<keyof typeof languages>('zh-CN');
  const lang = useMemo(() => {
    return languages[langName];
  }, [langName]);

  const [controls, controlsAPI] = useControls(
    () => ({
      ['⚙️']: folder({
        language: LevaCheckButtons({
          label: lang['editor.language'],
          selected: [langName],
          options: [
            { value: 'en-US', label: 'English' },
            { value: 'zh-CN', label: '简体中文' },
          ],
          onClick: (v) => {
            setLangName((v as (keyof typeof languages)[])[0]);
          },
          singleMode: true,
        }),
      }),
      refThickness: {
        label: lang['editor.refThickness'],
        min: 1,
        max: 80,
        step: 0.01,
        value: 20,
      },
      refFactor: {
        label: lang['editor.refFactor'],
        min: 1,
        max: 3,
        step: 0.01,
        value: 1.4,
      },
      refDispersion: {
        label: lang['editor.refDispersion'],
        min: 0,
        max: 50,
        step: 0.01,
        value: 7,
      },
      refFresnelRange: {
        label: lang['editor.refFresnelRange'],
        min: 0,
        max: 90,
        step: 0.01,
        value: 35,
      },
      refFresnelFactor: {
        label: lang['editor.refFresnelFactor'],
        min: 0,
        max: 100,
        step: 0.01,
        value: 100,
      },
      glareAngle: {
        label: lang['editor.glareAngle'],
        min: -180,
        max: 180,
        step: 0.01,
        value: 45,
      },
      blurRadius: {
        label: lang['editor.blurRadius'],
        min: 1,
        max: 200,
        step: 1,
        value: 1,
      },
      blurMargin: {
        label: lang['editor.blurMargin'],
        min: 0,
        max: 100,
        step: 0.01,
        value: 100,
      },
      tint: {
        label: lang['editor.tint'],
        value: { r: 255, b: 255, g: 255, a: 0 },
      },
      shadowExpand: {
        label: lang['editor.shadowExpand'],
        min: 2,
        max: 100,
        step: 0.01,
        value: 25,
      },
      shadowFactor: {
        label: lang['editor.shadowFactor'],
        min: 0,
        max: 100,
        step: 0.01,
        value: 25,
      },
      shadowPosition: LevaVectorNew({
        label: lang['editor.shadowPosition'],
        x: 0,
        y: -10,
        xMax: 20,
        yMax: 20,
      }),
      bgType: LevaContainer({
        label: lang['editor.bgType'],
        contentValue: 0,
        content: ({ value, setValue }) => (
          <div className={styles.bgSelect}>
            {[
              { v: 0, img: bgBarH, loadTexture: false },
              { v: 1, img: bgHalf, loadTexture: false },
              { v: 2, img: bgGrid, loadTexture: false },
              { v: 3, img: bgTahoeLightImg, loadTexture: true },
              { v: 4, img: bgTahoeDarkImg, loadTexture: true },
              { v: 5, img: bgTimcook, loadTexture: true },
            ].map(({ v, img, loadTexture }) => {
              return (
                <div
                  className={clsx(styles.bgSelectItem, {
                    [styles.bgSelectItemActive]: value === v,
                  })}
                  style={{ backgroundImage: `url(${img})` }}
                  key={v}
                  onClick={() => {
                    setValue(v);

                    if (loadTexture) {
                      stateRef.current.bgTextureUrl = img;
                    } else {
                      stateRef.current.bgTextureUrl = null;
                    }
                  }}
                ></div>
              );
            })}
          </div>
        ),
      }),
      // customBgImage: LevaImageUpload({
      //   label: lang['editor.customBgImage'],
      //   file: undefined,
      //   // disabled: renderProps.isRendering,
      //   // alphaPatternColorA: '#bbb',
      //   // alphaPatternColorB: '#eee',
      // }),
      [lang['editor.shapeSettings'] as 'shapeSettings']: folder({
        shapeWidth: {
          label: lang['editor.shapeWidth'],
          min: 20,
          max: 800,
          step: 1,
          value: 200,
        },
        shapeHeight: {
          label: lang['editor.shapeHeight'],
          min: 20,
          max: 800,
          step: 1,
          value: 200,
        },
        shapeRadius: {
          label: lang['editor.shapeRadius'],
          min: 1,
          max: 100,
          step: 0.1,
          value: 80,
        },
        shapeRoundness: {
          label: lang['editor.shapeRoundness'],
          min: 2,
          max: 7,
          step: 0.01,
          value: 5,
        },
        mergeRate: {
          label: lang['editor.mergeRate'],
          min: 0,
          max: 0.3,
          step: 0.01,
          value: 0.05,
        },
        showShape1: {
          label: lang['editor.showShape1'],
          value: true,
        },
      }),
      [lang['editor.animationSettings'] as 'animationSettings']: folder({
        springSizeFactor: {
          label: lang['editor.springSizeFactor'],
          min: 0,
          max: 50,
          step: 0.01,
          value: 10,
        },
      }),
    }),
    [langName],
  );

  const stateRef = useRef<{
    canvasWindowCtrlRef: ResizeWindowCtrlRefType | null;
    renderRaf: number | null;
    canvasInfo: typeof canvasInfo;
    glStates: {
      gl: WebGL2RenderingContext;
      programs: Record<string, WebGLProgram>;
      vao: WebGLVertexArrayObject;
    } | null;
    canvasPos: { x: number; y: number };
    canvasPointerPos: { x: number; y: number };
    controls: typeof controls;
    blurWeights: number[];
    lastMouseSpringValue: { x: number; y: number };
    lastMouseSpringTime: null | number;
    mouseSpring: Controller<{ x: number; y: number }>;
    mouseSpringSpeed: { x: number; y: number };
    bgTextureUrl: string | null;
    bgTexture: WebGLTexture | null;
    bgTextureRatio: number;
    langName: typeof langName;
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
    controls,
    blurWeights: [],
    lastMouseSpringValue: {
      x: 0,
      y: 0,
    },

    lastMouseSpringTime: null,
    mouseSpring: new Controller({
      x: 0,
      y: 0,
      onChange: (c) => {
        if (!stateRef.current.lastMouseSpringTime) {
          stateRef.current.lastMouseSpringTime = Date.now();
          stateRef.current.lastMouseSpringValue = c.value;
          return;
        }

        const now = Date.now();
        const lastValue = stateRef.current.lastMouseSpringValue;
        const dt = now - stateRef.current.lastMouseSpringTime;
        const dx = {
          x: c.value.x - lastValue.x,
          y: c.value.y - lastValue.y,
        };
        const speed = {
          x: dx.x / dt,
          y: dx.y / dt,
        };

        if (Math.abs(speed.x) > 1e10 || Math.abs(speed.y) > 1e10) {
          speed.x = 0;
          speed.y = 0;
        }

        stateRef.current.mouseSpringSpeed = speed;

        stateRef.current.lastMouseSpringValue = c.value;
        stateRef.current.lastMouseSpringTime = now;
      },
    }),
    mouseSpringSpeed: {
      x: 0,
      y: 0,
    },
    bgTextureUrl: null,
    bgTexture: null,
    bgTextureRatio: 1,
    langName: langName,
  });
  stateRef.current.canvasInfo = canvasInfo;
  stateRef.current.controls = controls;
  stateRef.current.langName = langName;

  // useEffect(() => {
  //   setLangName(controls.language[0] as keyof typeof languages);
  // }, [controls.language]);

  // console.log(controls.language);

  useMemo(() => {
    stateRef.current.blurWeights = computeGaussianKernelByRadius(controls.blurRadius);
  }, [controls.blurRadius]);

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
      const canvasInfo = stateRef.current.canvasInfo;
      if (!canvasInfo) {
        return;
      }
      stateRef.current.canvasPointerPos = {
        x: (e.clientX - stateRef.current.canvasPos.x) * canvasInfo.dpr,
        y:
          (stateRef.current.canvasInfo.height - (e.clientY - stateRef.current.canvasPos.y)) *
          canvasInfo.dpr,
      };
      stateRef.current.mouseSpring.start(stateRef.current.canvasPointerPos);
    };
    canvasEl.addEventListener('pointermove', onPointerMove);

    const gl = canvasEl.getContext('webgl2');
    if (!gl) {
      return;
    }

    const renderer = new MultiPassRenderer(canvasEl, [
      {
        name: 'bgPass',
        shader: {
          vertex: VertexShader,
          fragment: FragmentBgShader,
        },
      },
      {
        name: 'vBlurPass',
        shader: {
          vertex: VertexShader,
          fragment: FragmentBgVblurShader,
        },
        inputs: {
          u_prevPassTexture: 'bgPass',
        },
      },
      {
        name: 'hBlurPass',
        shader: {
          vertex: VertexShader,
          fragment: FragmentBgHblurShader,
        },
        inputs: {
          u_prevPassTexture: 'vBlurPass',
        },
      },
      {
        name: 'mainPass',
        shader: {
          vertex: VertexShader,
          fragment: FragmentMainShader,
        },
        inputs: {
          u_blurredBg: 'hBlurPass',
          u_bg: 'bgPass',
        },
        outputToScreen: true,
      },
    ]);

    // renderer.addPass(
    //   {
    //     vertex: VertexShader,
    //     fragment: FragmentBgShader,
    //   },
    //   true,
    // );
    // renderer.addPass(
    //   {
    //     vertex: VertexShader,
    //     fragment: FragmentBgVblurShader,
    //   },
    //   false,
    // )

    let raf: number | null = null;
    const lastState = {
      canvasInfo: null as typeof canvasInfo | null,
      bgTextureUrl: null as typeof stateRef.current.bgTextureUrl,
    };
    // let startTime: number | null = null
    const render = (t: number) => {
      raf = requestAnimationFrame(render);

      // let time = 0;
      // if (!startTime) {
      //   startTime = t;
      // } else {
      //   time = t - startTime;
      // }

      // console.log(time);

      const canvasInfo = stateRef.current.canvasInfo;
      const textureUrl = stateRef.current.bgTextureUrl;
      if (
        !lastState.canvasInfo ||
        lastState.canvasInfo.width !== canvasInfo.width ||
        lastState.canvasInfo.height !== canvasInfo.height ||
        lastState.canvasInfo.dpr !== canvasInfo.dpr
      ) {
        gl.viewport(
          0,
          0,
          Math.round(canvasInfo.width * canvasInfo.dpr),
          Math.round(canvasInfo.height * canvasInfo.dpr),
        );
        renderer.resize(canvasInfo.width * canvasInfo.dpr, canvasInfo.height * canvasInfo.dpr);
        renderer.setUniform('u_resolution', [
          canvasInfo.width * canvasInfo.dpr,
          canvasInfo.height * canvasInfo.dpr,
        ]);
        lastState.canvasInfo = canvasInfo;
      }
      if (textureUrl !== lastState.bgTextureUrl) {
        if (!textureUrl) {
          if (stateRef.current.bgTexture) {
            gl.deleteTexture(stateRef.current.bgTexture);
            stateRef.current.bgTexture = null;
          }
        } else {
          loadTextureFromURL(gl, textureUrl).then(({ texture, ratio }) => {
            if (stateRef.current.bgTextureUrl === textureUrl) {
              stateRef.current.bgTexture = texture;
              stateRef.current.bgTextureRatio = ratio;
            }
          });
        }

        lastState.bgTextureUrl = stateRef.current.bgTextureUrl;
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const controls = stateRef.current.controls;
      const mouseSpring = stateRef.current.mouseSpring.get();

      const shapeSizeSpring = {
        x:
          controls.shapeWidth +
          (Math.abs(stateRef.current.mouseSpringSpeed.x) *
            controls.shapeWidth *
            controls.springSizeFactor) /
          100,
        y:
          controls.shapeHeight +
          (Math.abs(stateRef.current.mouseSpringSpeed.y) *
            controls.shapeHeight *
            controls.springSizeFactor) /
          100,
      };

      renderer.setUniforms({
        u_resolution: [canvasInfo.width * canvasInfo.dpr, canvasInfo.height * canvasInfo.dpr],
        u_dpr: canvasInfo.dpr,
        u_blurWeights: stateRef.current.blurWeights,
        u_blurRadius: stateRef.current.controls.blurRadius,
        u_mouse: [stateRef.current.canvasPointerPos.x, stateRef.current.canvasPointerPos.y],
        u_mouseSpring: [mouseSpring.x, mouseSpring.y],
        u_shapeWidth: shapeSizeSpring.x,
        u_shapeHeight: shapeSizeSpring.y,
        u_shapeRadius:
          ((Math.min(shapeSizeSpring.x, shapeSizeSpring.y) / 2) * controls.shapeRadius) / 100,
        u_shapeRoundness: controls.shapeRoundness,
        u_mergeRate: controls.mergeRate,
        u_glareAngle: (controls.glareAngle * Math.PI) / 180,
        u_showShape1: controls.showShape1 ? 1 : 0,
      });

      renderer.render({
        bgPass: {
          u_bgType: controls.bgType,
          u_bgTexture: (stateRef.current.bgTextureUrl && stateRef.current.bgTexture) ?? undefined,
          u_bgTextureRatio:
            stateRef.current.bgTextureUrl && stateRef.current.bgTexture
              ? stateRef.current.bgTextureRatio
              : undefined,
          u_shadowExpand: controls.shadowExpand,
          u_shadowFactor: controls.shadowFactor / 100,
          u_shadowPosition: [-controls.shadowPosition.x, -controls.shadowPosition.y],
        },
        mainPass: {
          u_blurMargin: controls.blurMargin / 100,
          u_tint: [
            controls.tint.r / 255,
            controls.tint.g / 255,
            controls.tint.b / 255,
            controls.tint.a,
          ],
          u_refThickness: controls.refThickness,
          u_refFactor: controls.refFactor,
          u_refDispersion: controls.refDispersion,
          u_refFresnelRange: controls.refFresnelRange,
          u_refFresnelFactor: controls.refFresnelFactor / 100,
        },
      });
    };
    raf = requestAnimationFrame(render);

    return () => {
      canvasEl.removeEventListener('pointermove', onPointerMove);
      if (raf) {
        cancelAnimationFrame(raf);
      }
    };

    // // 创建shaderss
    // const vertexShader = createShader(gl, gl.VERTEX_SHADER, VertexShader);
    // const fragmentBgShader = createShader(gl, gl.FRAGMENT_SHADER, FragmentBgShader);
    // const fragmentBgVblurShader = createShader(gl, gl.FRAGMENT_SHADER, FragmentBgVblurShader);
    // const fragmentMainShader = createShader(gl, gl.FRAGMENT_SHADER, FragmentMainShader);
    // if (!vertexShader || !fragmentBgShader || !fragmentBgVblurShader || !fragmentMainShader) {
    //   return;
    // }

    // // 创建programs
    // const programBg = createProgram(gl, vertexShader, fragmentBgShader);
    // const programBgVblur = createProgram(gl, vertexShader, fragmentBgVblurShader);
    // const programMain = createProgram(gl, vertexShader, fragmentMainShader);
    // if (!programBg || !programMain || !programBgVblur) {
    //   return;
    // }

    // // 输入用户绘制的数据
    // // 创建buffer
    // const positionBuffer = gl.createBuffer();
    // // 绑定到全局的 gl.ARRAY_BUFFER 绑定点上，供后续操作
    // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // // 往Buffer上存放数据
    // const positionData = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
    // gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);

    // // 创建buffer
    // const vcolorBuffer = gl.createBuffer();
    // // 绑定到全局的 gl.ARRAY_BUFFER 绑定点上，供后续操作
    // gl.bindBuffer(gl.ARRAY_BUFFER, vcolorBuffer);
    // // 往Buffer上存放数据
    // const vcolorData = new Uint8Array([
    //   255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
    // ]);
    // gl.bufferData(gl.ARRAY_BUFFER, vcolorData, gl.STATIC_DRAW);

    // //创建VAO
    // // VAO，属性状态的集合，可以保存一堆 attributes （定义了buffer如何被访问）
    // const vao = gl.createVertexArray();
    // // 绑定到全局的 VERTEX_ARRAY_BINDING 绑定点上，供后续操作
    // gl.bindVertexArray(vao);

    // // 设置attribute对应的数据和数据读取方式
    // // 获取属性（attribute）的索引号。使用索引号来引用到GPU维护的属性列表中
    // const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    // // 获取uniform的索引号
    // const uResolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    // const uMouseLocation = gl.getUniformLocation(program, 'u_mouse');
    // const uTimeLocation = gl.getUniformLocation(program, 'u_time');
    // const uBlurRadiusLocation = gl.getUniformLocation(program, 'u_blurRadius');
    // const uBlurWeightsLocation = gl.getUniformLocation(program, 'u_blurWeights');

    // // 激活该index下的属性以便使用
    // gl.enableVertexAttribArray(positionAttributeLocation);
    // // 这里前序已经操作过了，可以不做。但是如果被改变了，这里需调整回来
    // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // // 告诉显卡，这个attribute如何 读取和使用 当前在 gl.ARRAY_BUFFER 上对应的buffer数据
    // // 相关信息存储在VAO（的attributes）中
    // gl.vertexAttribPointer(
    //   positionAttributeLocation, // index: attribute索引号
    //   2, // size: 每次vertex shader迭代，所使用的buffer元素数量，这里是2个值（x，y坐标）
    //   gl.FLOAT, // type: 值类型
    //   false, // normalized: 是否normalize（归一化），例如gl.BYTE类型（-128～127）将转换为[-1, 1], gl.UNSIGNED_BYTE 转换为[0, 1]
    //   0, // stride：buffer中每次迭代跳过的数据偏移量。为0则为紧密打包的。
    //   0, // offset: 顶点数组的第一个部分的字节偏移量。必须是字节长度的倍数
    // );

    // // 获取属性（attribute）的索引号。使用索引号来引用到GPU维护的属性列表中
    // const vcolorAttributeLocation = gl.getAttribLocation(program, 'a_color');
    // // 激活该index下的属性以便使用
    // gl.enableVertexAttribArray(vcolorAttributeLocation);
    // // 这里前序已经操作过了，可以不做。但是如果被改变了，这里需调整回来
    // gl.bindBuffer(gl.ARRAY_BUFFER, vcolorBuffer);
    // // 告诉显卡，这个attribute如何 读取和使用 当前在 gl.ARRAY_BUFFER 上对应的buffer数据
    // // 相关信息存储在VAO（的attributes）中
    // gl.vertexAttribPointer(
    //   vcolorAttributeLocation, // index: attribute索引号
    //   4, // size: 每次vertex shader迭代，所使用的buffer元素数量，这里是2个值（x，y坐标）
    //   gl.UNSIGNED_BYTE, // type: 值类型
    //   true, // normalized: 是否normalize（归一化），例如gl.BYTE类型（-128～127）将转换为[-1, 1], gl.UNSIGNED_BYTE 转换为[0, 1]
    //   0, // stride：buffer中每次迭代跳过的数据偏移量。为0则为紧密打包的。
    //   0, // offset: 顶点数组的第一个部分的字节偏移量。必须是字节长度的倍数
    // );

    // // 现在，各种状态值准备就绪
    // // 可以启用program了，此时program能够通过VAO读取顶点相关的attributes和buffer
    // // 传入link好的shader中进行处理和绘制了
    // gl.useProgram(program);
    // //
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
    // stateRef.current.glStates = {
    //   gl,
    //   programs: {
    //     bg: programBg,
    //     bgVblur: programBgVblur,
    //     main: programMain,
    //   },
    //   vao,
    // };

    // let raf: number | null = null;
    // const render = (t: number) => {
    //   raf = requestAnimationFrame(render);
    //   if (!stateRef.current.glStates) {
    //     return;
    //   }
    //   if (!stateRef.current.blurWeights.length) {
    //     return;
    //   }

    //   const { gl, program, vao } = stateRef.current.glStates;
    //   const { canvasInfo } = stateRef.current;

    //   gl.viewport(
    //     0,
    //     0,
    //     Math.round(canvasInfo.width * canvasInfo.dpr),
    //     Math.round(canvasInfo.height * canvasInfo.dpr),
    //   );

    //   gl.clearColor(0, 0, 0, 0);
    //   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //   gl.useProgram(program);

    //   gl.bindVertexArray(vao);
    //   gl.uniform2f(
    //     uResolutionLocation,
    //     Math.round(canvasInfo.width * canvasInfo.dpr),
    //     Math.round(canvasInfo.height * canvasInfo.dpr),
    //   );
    //   // console.log(canvasInfo)
    //   gl.uniform2f(uMouseLocation, stateRef.current.canvasPointerPos.x, stateRef.current.canvasPointerPos.y);

    //   gl.uniform1i(uBlurRadiusLocation, stateRef.current.controls.blurRadius);
    //   gl.uniform1fv(uBlurWeightsLocation, stateRef.current.blurWeights);

    //   // gl.uniform1f(timeUniformLocation, t / 1000);

    //   gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // };
    // raf = requestAnimationFrame(render);

    // return () => {
    //   canvasEl.removeEventListener('pointermove', onPointerMove);
    //   if (raf) {
    //     cancelAnimationFrame(raf);
    //   }
    // };
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
      <Leva
        theme={{
          sizes: {
            rootWidth: lang['_settings'].rootWidth,
            numberInputMinWidth: lang['_settings'].numberInputMinWidth,
            controlWidth: lang['_settings'].controlWidth,
          },
          space: {
            colGap: '5px',
          },
        }}
      ></Leva>
    </>
  );
}

export default App;
