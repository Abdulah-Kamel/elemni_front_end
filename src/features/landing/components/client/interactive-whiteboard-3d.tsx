"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Hand } from "lucide-react";
import { MarkerHighlight } from "@/src/components/ui/marker-highlight";
import InteractiveWhiteboardMobile from "./interactive-whiteboard-mobile";

interface StickyNoteData {
  id: string;
  category: "step" | "feature";
  stepNumber: string;
  numberDisplay: string; // Arabic numeral for badge (١, ٢, ٣, ٤, ٥, ٦)
  title: string;
  content: string;
  highlightWords: string[];
  color: string;
  textColor: string;
  headerColor: string;
  highlighterColor: string;
  pinColor: number;
  x: number;
  y: number;
  rotation: number;
}

// 6 Sticky Notes arranged in RTL sequence (Starting from Top-Right to Top-Left, then Bottom-Right to Bottom-Left)
const BOARD_NOTES: StickyNoteData[] = [
  // --- Row 1: كيف تبدأ (RTL: Step 1 Right -> Step 2 Center -> Step 3 Left) ---
  {
    id: "step-1",
    category: "step",
    stepNumber: "1",
    numberDisplay: "١",
    title: "إنشاء حساب",
    content: "سجّل مجاناً باستخدام هاتفك في أقل من دقيقة وابدأ رحلتك.",
    highlightWords: ["أقل من دقيقة", "مجاناً"],
    color: "#FEF08A", // Bright Yellow
    textColor: "#3F2305",
    headerColor: "#F59E0B",
    highlighterColor: "rgba(245, 158, 11, 0.5)",
    pinColor: 0xef4444, // Red pin
    x: 3.3, // Right side for RTL Start
    y: 1.15,
    rotation: -0.03,
  },
  {
    id: "step-2",
    category: "step",
    stepNumber: "2",
    numberDisplay: "٢",
    title: "اختر المدرس والكورس",
    content: "تصفح المدرسين المتخصصين واختر الكورس المناسب لمادتك.",
    highlightWords: ["المدرسين المتخصصين", "الكورس المناسب"],
    color: "#BAE6FD", // Bright Sky Blue
    textColor: "#0C4A6E",
    headerColor: "#0284C7",
    highlighterColor: "rgba(2, 132, 199, 0.4)",
    pinColor: 0xef4444,
    x: 0.0, // Center
    y: 1.35,
    rotation: 0.03,
  },
  {
    id: "step-3",
    category: "step",
    stepNumber: "3",
    numberDisplay: "٣",
    title: "ابدأ التعلم المباشر",
    content: "احضر الحصص المباشرة، حل الأسئلة، وتابع تقدمك أولاً بأول.",
    highlightWords: ["الحصص المباشرة", "تابع تقدمك"],
    color: "#BBF7D0", // Bright Light Green
    textColor: "#064E3B",
    headerColor: "#10B981",
    highlighterColor: "rgba(16, 185, 129, 0.45)",
    pinColor: 0xef4444,
    x: -3.3, // Left side
    y: 1.15,
    rotation: -0.03,
  },

  // --- Row 2: رحلة التفوق مع علمني (RTL: Feature 1 Right -> Feature 2 Center -> Feature 3 Left) ---
  {
    id: "feature-1",
    category: "feature",
    stepNumber: "01",
    numberDisplay: "٤",
    title: "افهم صح",
    content: "دروس تفاعلية وبث مباشر مع نخبة من أذكى المدرسين.",
    highlightWords: ["دروس تفاعلية", "أذكى المدرسين"],
    color: "#E9D5FF", // Bright Purple
    textColor: "#3B0764",
    headerColor: "#8B5CF6",
    highlighterColor: "rgba(139, 92, 246, 0.4)",
    pinColor: 0x8b5cf6, // Violet pin
    x: 3.3, // Right side
    y: -1.25,
    rotation: 0.04,
  },
  {
    id: "feature-2",
    category: "feature",
    stepNumber: "02",
    numberDisplay: "٥",
    title: "اتدرب كتير",
    content: "امتحانات مستمرة وبنوك أسئلة شاملة عشان تثبت المعلومة.",
    highlightWords: ["بنوك أسئلة", "تثبت المعلومة"],
    color: "#FBCFE8", // Bright Pink
    textColor: "#4C0519",
    headerColor: "#EC4899",
    highlighterColor: "rgba(236, 72, 153, 0.45)",
    pinColor: 0x8b5cf6,
    x: 0.0, // Center
    y: -1.45,
    rotation: -0.04,
  },
  {
    id: "feature-3",
    category: "feature",
    stepNumber: "03",
    numberDisplay: "٦",
    title: "تفوق بجدارة",
    content: "تقارير أداء ودعم مستمر معاك لحد باب اللجان.",
    highlightWords: ["تقارير أداء", "باب اللجان"],
    color: "#FED7AA", // Bright Orange
    textColor: "#431407",
    headerColor: "#F97316",
    highlighterColor: "rgba(249, 115, 22, 0.45)",
    pinColor: 0x8b5cf6,
    x: -3.3, // Left side
    y: -1.25,
    rotation: 0.03,
  },
];

export default function InteractiveWhiteboard3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHoveringNote, setIsHoveringNote] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Imperfect Hand-Drawn Marker Highlighter Drawing Helper for Canvas
  const drawImperfectHighlighter = (
    ctx: CanvasRenderingContext2D,
    xRight: number,
    textWidth: number,
    yCenter: number,
    color: string
  ) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 58;

    const startX = xRight + 12;
    const endX = xRight - textWidth - 12;

    const y1 = yCenter - 16 + Math.sin(startX * 0.03) * 5;
    const y2 = yCenter - 12 + Math.cos(endX * 0.03) * 6;
    const midX = (startX + endX) / 2;
    const midY = (y1 + y2) / 2 + 4;

    ctx.beginPath();
    ctx.moveTo(startX, y1);
    ctx.quadraticCurveTo(midX, midY, endX, y2);
    ctx.stroke();

    ctx.restore();
  };

  // High-Resolution Sticky Note Texture Generator
  const createStickyNoteTexture = (
    note: StickyNoteData,
    maxAnisotropy: number = 16
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Pure Vibrant Paper background
    ctx.fillStyle = note.color;
    ctx.fillRect(0, 0, 1024, 1024);

    // Top Accent Header Line
    ctx.fillStyle = note.headerColor;
    ctx.fillRect(0, 0, 1024, 96);

    // Subtle paper grid lines
    ctx.strokeStyle = "rgba(0, 0, 0, 0.03)";
    ctx.lineWidth = 3;
    for (let y = 160; y < 1024; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Pin hole circle at top center
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.beginPath();
    ctx.arc(512, 48, 18, 0, Math.PI * 2);
    ctx.fill();

    // --- Number Badge on Top-Left (x: 96, y: 48) ---
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.arc(96, 48, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = note.headerColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.direction = "ltr";
    ctx.textAlign = "center";
    ctx.fillStyle = note.textColor;
    ctx.font = "bold 38px Cairo, 'Segoe UI', Arial, sans-serif";
    ctx.fillText(note.numberDisplay, 96, 61);

    // Context RTL setup for title & text
    ctx.direction = "rtl";
    ctx.textAlign = "right";

    // --- Title rendering with imperfect highlighter stroke ---
    ctx.font = "bold 68px Cairo, 'Segoe UI', Arial, sans-serif";
    const titleWidth = ctx.measureText(note.title).width;

    drawImperfectHighlighter(
      ctx,
      940,
      titleWidth,
      200,
      note.highlighterColor
    );

    ctx.fillStyle = note.textColor;
    ctx.fillText(note.title, 940, 210);

    // Header Separator Line
    ctx.strokeStyle = note.headerColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(80, 250);
    ctx.lineTo(940, 250);
    ctx.stroke();

    // --- Body Text & Word Highlighters ---
    ctx.font = "bold 72px Cairo, 'Segoe UI', Arial, sans-serif";
    const words = note.content.split(" ");
    const lines: string[] = [];
    let line = "";
    const maxWidth = 860;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    let startY = 350;
    const lineHeight = 86;

    lines.forEach((lText) => {
      note.highlightWords.forEach((phrase) => {
        if (lText.includes(phrase)) {
          const phraseIndex = lText.indexOf(phrase);
          const textBefore = lText.substring(0, phraseIndex);

          const widthBefore = ctx.measureText(textBefore).width;
          const phraseWidth = ctx.measureText(phrase).width;
          const phraseRightX = 940 - widthBefore;

          drawImperfectHighlighter(
            ctx,
            phraseRightX,
            phraseWidth,
            startY - 18,
            note.highlighterColor
          );
        }
      });

      ctx.fillStyle = note.textColor;
      ctx.fillText(lText, 940, startY);
      startY += lineHeight;
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    if (maxAnisotropy > 1) {
      texture.anisotropy = maxAnisotropy;
    }
    texture.needsUpdate = true;
    return texture;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    const getBgColor = () =>
      document.documentElement.classList.contains("dark") ? "#0B132B" : "#FAF8FF";
    scene.background = new THREE.Color(getBgColor());

    const themeObserver = new MutationObserver(() => {
      scene.background = new THREE.Color(getBgColor());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // 2. Camera Setup (Responsive Perspective Camera with dynamic FOV scaling)
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);

    // Dynamic Camera Distance calculation for Mobile & Tablet viewports
    const updateCameraDistance = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      const aspect = w / h;
      camera.aspect = aspect;

      // Horizontal width of board + frame is ~10.8 units.
      // Adjust Z distance so that board fits inside viewport horizontally without clipping on narrow screens
      const minZ = 10.8;
      const halfBoardWidth = 5.6; // world units from center
      const verticalFovRad = THREE.MathUtils.degToRad(36 / 2);
      const calculatedZ = halfBoardWidth / (Math.tan(verticalFovRad) * aspect);

      camera.position.z = Math.max(minZ, calculatedZ);
      camera.position.y = -0.35;
      camera.updateProjectionMatrix();
    };

    updateCameraDistance();
    camera.lookAt(0, -0.2, 0);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // 4. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.45);
    dirLight.position.set(2, 6, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const softFillLight = new THREE.PointLight(0xffffff, 0.3, 20);
    softFillLight.position.set(0, 0, 8);
    scene.add(softFillLight);

    // 5. Realistic 3D Whiteboard Surface & Frame
    const boardWidth = 10.2;
    const boardHeight = 5.6;

    const boardGeo = new THREE.BoxGeometry(boardWidth, boardHeight, 0.15);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.05,
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.set(0, 0, -0.08);
    boardMesh.receiveShadow = true;
    scene.add(boardMesh);

    // Visible Canvas Dot-Grid Pattern Overlay for Whiteboard feeling
    const gridCanvas = document.createElement("canvas");
    gridCanvas.width = 512;
    gridCanvas.height = 512;
    const gctx = gridCanvas.getContext("2d");
    if (gctx) {
      gctx.fillStyle = "#FFFFFF";
      gctx.fillRect(0, 0, 512, 512);

      gctx.fillStyle = "rgba(100, 116, 139, 0.22)"; // Slate dot color
      const step = 40;
      for (let x = 20; x < 512; x += step) {
        for (let y = 20; y < 512; y += step) {
          gctx.beginPath();
          gctx.arc(x, y, 3.2, 0, Math.PI * 2);
          gctx.fill();
        }
      }
    }
    const gridTexture = new THREE.CanvasTexture(gridCanvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(6, 3.5);
    if (maxAnisotropy > 1) gridTexture.anisotropy = maxAnisotropy;

    const gridMat = new THREE.MeshBasicMaterial({
      map: gridTexture,
      transparent: true,
      opacity: 0.95,
    });
    const gridPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(boardWidth, boardHeight),
      gridMat
    );
    gridPlane.position.set(0, 0, 0.001);
    scene.add(gridPlane);

    // Aluminum Whiteboard Frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.8,
      roughness: 0.2,
    });
    const borderThick = 0.22;

    const frameTop = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth + borderThick * 2, borderThick, 0.22),
      frameMat
    );
    frameTop.position.set(0, boardHeight / 2 + borderThick / 2, 0);
    scene.add(frameTop);

    const frameBottom = new THREE.Mesh(
      new THREE.BoxGeometry(boardWidth + borderThick * 2, borderThick, 0.22),
      frameMat
    );
    frameBottom.position.set(0, -boardHeight / 2 - borderThick / 2, 0);
    scene.add(frameBottom);

    const frameLeft = new THREE.Mesh(
      new THREE.BoxGeometry(borderThick, boardHeight, 0.22),
      frameMat
    );
    frameLeft.position.set(-boardWidth / 2 - borderThick / 2, 0, 0);
    scene.add(frameLeft);

    const frameRight = new THREE.Mesh(
      new THREE.BoxGeometry(borderThick, boardHeight, 0.22),
      frameMat
    );
    frameRight.position.set(boardWidth / 2 + borderThick / 2, 0, 0);
    scene.add(frameRight);

    // Whiteboard Metallic Corner Caps
    const cornerMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cornerSize = borderThick * 1.1;
    const cornerOffsets = [
      [-boardWidth / 2 - borderThick / 2, boardHeight / 2 + borderThick / 2],
      [boardWidth / 2 + borderThick / 2, boardHeight / 2 + borderThick / 2],
      [-boardWidth / 2 - borderThick / 2, -boardHeight / 2 - borderThick / 2],
      [boardWidth / 2 + borderThick / 2, -boardHeight / 2 - borderThick / 2],
    ];
    cornerOffsets.forEach(([cx, cy]) => {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(cornerSize, cornerSize, 0.26),
        cornerMat
      );
      cap.position.set(cx, cy, 0.01);
      scene.add(cap);
    });

    // --- Compact Whiteboard Marker Tray & Pens Stand ---
    const trayLength = 4.2;
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0xc0c6d0,
      metalness: 0.85,
      roughness: 0.2,
    });

    // Tray Shelf Base
    const trayBase = new THREE.Mesh(
      new THREE.BoxGeometry(trayLength, 0.08, 0.38),
      trayMat
    );
    trayBase.position.set(0, -boardHeight / 2 - 0.04, 0.18);
    trayBase.castShadow = true;
    scene.add(trayBase);

    // Front lip guard of tray
    const trayLip = new THREE.Mesh(
      new THREE.BoxGeometry(trayLength, 0.06, 0.04),
      trayMat
    );
    trayLip.position.set(0, -boardHeight / 2 - 0.01, 0.35);
    scene.add(trayLip);

    // Realistic Whiteboard Pens / Markers lying on the tray
    const markerData = [
      { color: 0xef4444, capColor: 0xd97706, xOffset: -1.4 }, // Red marker
      { color: 0x2563eb, capColor: 0x1d4ed8, xOffset: -0.7 }, // Blue marker
      { color: 0x10b981, capColor: 0x059669, xOffset: 0.0 }, // Green marker
      { color: 0x1e293b, capColor: 0x0f172a, xOffset: 0.7 }, // Black marker
    ];

    markerData.forEach((m) => {
      const penGroup = new THREE.Group();

      // Pen Barrel (White)
      const bodyGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.65, 16);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.2,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      penGroup.add(body);

      // Color Cap
      const capGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.18, 16);
      const capMat = new THREE.MeshStandardMaterial({
        color: m.color,
        roughness: 0.3,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.x = 0.38;
      penGroup.add(cap);

      penGroup.position.set(m.xOffset, -boardHeight / 2 - 0.01, 0.22);
      penGroup.castShadow = true;
      scene.add(penGroup);
    });

    // Felt Whiteboard Eraser on tray
    const eraserGroup = new THREE.Group();

    const eraserTopMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
    });
    const eraserTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.12, 0.26),
      eraserTopMat
    );
    eraserGroup.add(eraserTop);

    const feltMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
    });
    const felt = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.03, 0.26),
      feltMat
    );
    felt.position.y = -0.06;
    eraserGroup.add(felt);

    eraserGroup.position.set(1.5, -boardHeight / 2, 0.22);
    eraserGroup.castShadow = true;
    scene.add(eraserGroup);

    // 6. Sticky Notes & 3D Pushpins Creation
    const notesGroup = new THREE.Group();
    scene.add(notesGroup);

    const noteMeshesMap = new Map<string, THREE.Group>();
    const noteGeo = new THREE.PlaneGeometry(2.1, 2.1);

    const createPushpinMesh = (color: number) => {
      const pinGroup = new THREE.Group();

      const needleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
      const needleMat = new THREE.MeshStandardMaterial({
        color: 0xd1d5db,
        metalness: 0.9,
        roughness: 0.2,
      });
      const needle = new THREE.Mesh(needleGeo, needleMat);
      needle.position.set(0, 0, -0.05);
      needle.rotation.x = Math.PI / 2;
      pinGroup.add(needle);

      const headGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.2,
        metalness: 0.1,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 0, 0.08);
      head.castShadow = true;
      pinGroup.add(head);

      const capGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.4,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, 0, 0.14);
      cap.rotation.x = Math.PI / 2;
      pinGroup.add(cap);

      return pinGroup;
    };

    BOARD_NOTES.forEach((noteData) => {
      const noteContainer = new THREE.Group();

      const texture = createStickyNoteTexture(noteData, maxAnisotropy);

      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.4,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });

      const paperMesh = new THREE.Mesh(noteGeo, mat);
      paperMesh.castShadow = true;
      paperMesh.receiveShadow = true;
      noteContainer.add(paperMesh);

      const pinMesh = createPushpinMesh(noteData.pinColor);
      pinMesh.position.set(0, 0.92, 0.04);
      noteContainer.add(pinMesh);

      noteContainer.position.set(noteData.x, noteData.y, 0.05);
      noteContainer.rotation.z = noteData.rotation;
      noteContainer.userData = { id: noteData.id, noteData };

      notesGroup.add(noteContainer);
      noteMeshesMap.set(noteData.id, noteContainer);
    });

    if (document.fonts) {
      document.fonts.ready.then(() => {
        BOARD_NOTES.forEach((noteData) => {
          const container = noteMeshesMap.get(noteData.id);
          if (container) {
            const paperMesh = container.children[0] as THREE.Mesh;
            if (paperMesh && paperMesh.material) {
              const newTex = createStickyNoteTexture(noteData, maxAnisotropy);
              const mat = paperMesh.material as THREE.MeshStandardMaterial;
              mat.map = newTex;
              mat.emissiveMap = newTex;
              mat.needsUpdate = true;
            }
          }
        });
      });
    }

    // 7. 3D Connecting Rope / Thread Lines (RTL Sequence)
    const createRopeMesh = (color: number) => {
      const ropeMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.1,
      });

      const dummyGeo = new THREE.BufferGeometry();
      const ropeMesh = new THREE.Mesh(dummyGeo, ropeMat);
      ropeMesh.castShadow = true;
      scene.add(ropeMesh);
      return ropeMesh;
    };

    const rope1Mesh = createRopeMesh(0xef4444); // Red thread for Steps 1 -> 2 -> 3 (Right to Left)
    const rope2Mesh = createRopeMesh(0x8b5cf6); // Violet thread for Features 1 -> 2 -> 3 (Right to Left)
    const rope3Mesh = createRopeMesh(0xf59e0b); // Amber thread connecting Step 3 (Top Left) to Feature 1 (Bottom Right)

    const updateRopeGeometry = (
      ropeMesh: THREE.Mesh,
      nodeIds: string[],
      sagAmount: number = -0.2
    ) => {
      const points: THREE.Vector3[] = [];

      nodeIds.forEach((id) => {
        const noteContainer = noteMeshesMap.get(id);
        if (noteContainer) {
          const pinPos = new THREE.Vector3(0, 0.92, 0.12);
          pinPos.applyMatrix4(noteContainer.matrixWorld);
          points.push(pinPos);
        }
      });

      if (points.length < 2) return;

      const curvePoints: THREE.Vector3[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        const pA = points[i];
        const pB = points[i + 1];
        const midPoint = new THREE.Vector3()
          .addVectors(pA, pB)
          .multiplyScalar(0.5);
        midPoint.y += sagAmount;
        midPoint.z += 0.05;

        const subCurve = new THREE.QuadraticBezierCurve3(pA, midPoint, pB);
        const subPoints = subCurve.getPoints(12);

        if (i > 0) subPoints.shift();
        curvePoints.push(...subPoints);
      }

      const catmullCurve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(catmullCurve, 40, 0.035, 8, false);

      if (ropeMesh.geometry) ropeMesh.geometry.dispose();
      ropeMesh.geometry = tubeGeo;
    };

    const updateAllRopes = () => {
      scene.updateMatrixWorld(true);
      // RTL Flow: Right to Left for Step 1 -> 2 -> 3
      updateRopeGeometry(rope1Mesh, ["step-1", "step-2", "step-3"], -0.22);
      // RTL Flow: Right to Left for Feature 1 -> 2 -> 3
      updateRopeGeometry(
        rope2Mesh,
        ["feature-1", "feature-2", "feature-3"],
        -0.22
      );
      // Bridge Connection from Step 3 (Top Left) to Feature 1 (Bottom Right)
      updateRopeGeometry(rope3Mesh, ["step-3", "feature-1"], -0.35);
    };

    updateAllRopes();

    // 8. Raycasting & Dragging System with Mobile/Tablet Touch Support
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeIntersect = new THREE.Vector3();

    let draggedGroup: THREE.Group | null = null;
    const dragOffset = new THREE.Vector3();
    let targetZ = 0.05;

    const getNDCCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      getNDCCoordinates(e);
      raycaster.setFromCamera(mouse, camera);

      const allPaperMeshes: THREE.Object3D[] = [];
      notesGroup.children.forEach((group) => {
        allPaperMeshes.push(group.children[0]);
      });

      const intersects = raycaster.intersectObjects(allPaperMeshes);
      if (intersects.length > 0) {
        draggedGroup = intersects[0].object.parent as THREE.Group;
        setIsDragging(true);

        if (e.cancelable) {
          e.preventDefault();
        }

        notesGroup.attach(draggedGroup);
        targetZ = 0.4;

        dragPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 0, 1),
          draggedGroup.position
        );
        if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
          dragOffset.copy(draggedGroup.position).sub(planeIntersect);
        }
      }
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      getNDCCoordinates(e);
      raycaster.setFromCamera(mouse, camera);

      if (draggedGroup) {
        if (e.cancelable) {
          e.preventDefault();
        }

        dragPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, targetZ)
        );
        if (raycaster.ray.intersectPlane(dragPlane, planeIntersect)) {
          const newPos = planeIntersect.add(dragOffset);
          const clampX = Math.max(-4.0, Math.min(4.0, newPos.x));
          const clampY = Math.max(-2.1, Math.min(2.1, newPos.y));

          draggedGroup.position.x = THREE.MathUtils.lerp(
            draggedGroup.position.x,
            clampX,
            0.4
          );
          draggedGroup.position.y = THREE.MathUtils.lerp(
            draggedGroup.position.y,
            clampY,
            0.4
          );
          draggedGroup.position.z = THREE.MathUtils.lerp(
            draggedGroup.position.z,
            targetZ,
            0.3
          );

          updateAllRopes();
        }
      } else {
        const allPaperMeshes: THREE.Object3D[] = [];
        notesGroup.children.forEach((group) => {
          allPaperMeshes.push(group.children[0]);
        });
        const intersects = raycaster.intersectObjects(allPaperMeshes);
        setIsHoveringNote(intersects.length > 0);
      }
    };

    const handlePointerUp = () => {
      if (draggedGroup) {
        draggedGroup.position.z = 0.05;
        draggedGroup = null;
        setIsDragging(false);
        updateAllRopes();
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", handlePointerDown);
    domElement.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    domElement.addEventListener("touchstart", handlePointerDown, {
      passive: false,
    });
    domElement.addEventListener("touchmove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("touchend", handlePointerUp);

    // 9. Camera Parallax (Enabled on desktop and touch devices)
    let targetCamX = 0;
    let targetCamY = -0.35;
    const handleContainerMouseMove = (e: MouseEvent) => {
      if (draggedGroup) return;
      const rect = container.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      targetCamX = relX * 0.6;
      targetCamY = -0.35 - relY * 0.3;
    };
    container.addEventListener("mousemove", handleContainerMouseMove);

    // 10. Resize Listener with Responsive Camera Calculation
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      updateCameraDistance();
      updateAllRopes();
    };
    window.addEventListener("resize", handleResize);

    // 11. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        targetCamX,
        0.05
      );
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        targetCamY,
        0.05
      );
      camera.lookAt(0, -0.2, 0);

      const elapsedTime = clock.getElapsedTime();
      notesGroup.children.forEach((child, idx) => {
        if (child !== draggedGroup) {
          const floatOffset = Math.sin(elapsedTime * 1.5 + idx) * 0.006;
          child.position.z = 0.05 + floatOffset;
        }
      });

      updateAllRopes();

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("mousedown", handlePointerDown);
      domElement.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      domElement.removeEventListener("touchstart", handlePointerDown);
      domElement.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
      container.removeEventListener("mousemove", handleContainerMouseMove);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      themeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <section className="relative w-full py-12 sm:py-16 bg-[#FAF8FF] dark:bg-[#0B132B] border-y border-violet-tint/60 dark:border-slate-800/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Title Header with Imperfect Hand-Drawn Highlighters */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 font-cairo leading-tight">
          كيف تبدأ{" "}
          <MarkerHighlight color="yellow" variant={1}>
            وتتفوق
          </MarkerHighlight>{" "}
          مع منصة{" "}
          <MarkerHighlight color="purple" variant={2}>
            علمني؟
          </MarkerHighlight>
        </h2>

        {/* Subtitle Paragraph with Organic Marker Highlighters */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
          خطوات بسيطة وممنهجة تأخذك من{" "}
          <MarkerHighlight color="sky" variant={3}>
            البداية وحتى القمة
          </MarkerHighlight>
          . يمكنك{" "}
          <MarkerHighlight color="pink" variant={4}>
            سحب الملاحظات المترابطة
          </MarkerHighlight>{" "}
          بحبال التوصيل لتنظيم رحلتك بنفسك!
        </p>

        {/* Drag Hint Bar with Marker Highlighter */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 shadow-sm">
            <Hand className="w-4 h-4 text-violet shrink-0" />
            <span>
              اسحب أو حرك بالملمس أي{" "}
              <MarkerHighlight color="emerald" variant={1}>
                ملاحظة
              </MarkerHighlight>{" "}
              لتعديل موقعها على السبورة
            </span>
          </div>
        </div>

        {/* Mobile Viewport: 2D HTML + Framer Motion interactive board & list view */}
        <div className="block md:hidden">
          <InteractiveWhiteboardMobile />
        </div>

        {/* Desktop Viewport: 3D Three.js WebGL interactive whiteboard */}
        <div className="hidden md:block relative w-full h-165 lg:h-185 rounded-3xl border border-violet-tint/80 dark:border-slate-800 shadow-[0_4px_24px_rgba(123,44,191,0.06)] bg-[#FAF8FF] dark:bg-[#0B132B] overflow-hidden">
          <div
            ref={containerRef}
            className={`w-full h-full touch-none ${isDragging
              ? "cursor-grabbing"
              : isHoveringNote
                ? "cursor-grab"
                : "cursor-default"
              }`}
          />
        </div>
      </div>
    </section>
  );
}
