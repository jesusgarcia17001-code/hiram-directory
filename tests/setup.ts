import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock de server-only para permitir pruebas unitarias de server actions y rutas de servidor en vitest
vi.mock("server-only", () => ({}));
