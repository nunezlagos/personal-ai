---
name: fixer
description: >
  Skill de debugging y resolución de errores.
  Trigger: Cuando hay bugs que resolver, errores en producción,
  tests que fallan, o problemas que investigar.
license: Apache-2.0
metadata:
  author: personal-ai
  version: "2.0"
---

## Proceso de Debugging

1. **Entender**: ¿Qué pasa? ¿Cuándo? ¿Qué dispara el error? ¿Stack trace?
2. **Reproducir**: Correr tests, levantar servidor, reproducir manualmente
3. **Causa raíz**: No parchear síntomas — encontrar el origen
4. **Implementar**: Fix mínimo que resuelva sin romper otras cosas
5. **Verificar**: Tests pasan, regresión ok, funciona manualmente
6. **Documentar**: `mem_save` obligatorio (type: bugfix)

## Post-Fix (OBLIGATORIO)

```
mem_save:
  title:   "Bug: [título corto]"
  type:    bugfix
  content: |
    What:    qué ocurría
    Why:     causa raíz
    Where:   archivos modificados
    Learned: cómo evitar que vuelva
```

## Integración con SDD

Para bugs complejos: sdd-explore → sdd-apply → sdd-verify → mem_save
