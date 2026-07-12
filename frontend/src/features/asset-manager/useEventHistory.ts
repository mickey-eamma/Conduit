import { useState, type Dispatch } from 'react';
import { defaultAsset, defaultStages } from '../../domain/eventHistory';
import { featureById } from '../../state/network/networkSelectors';
import type { AssetRecord, EventRecord, LineFeature } from '../../domain/types';
import type { NetworkAction, NetworkState } from '../../state/network/networkTypes';

export interface UseEventHistoryResult {
  feature: LineFeature | null;
  stageIndex: number | null;
  open: (feature: LineFeature) => void;
  close: () => void;
  openStage: (i: number) => void;
  backToStages: () => void;
  onEscape: () => void;
  updateAsset: (patch: Partial<AssetRecord>) => void;
  addStage: (name: string) => void;
  removeStage: (i: number) => void;
  addEvent: () => void;
  removeEvent: (i: number) => void;
  updateEvent: (i: number, patch: Partial<EventRecord>) => void;
}

/**
 * Owns which line's Event History modal is open and which level it's showing
 * (stages list vs. a specific stage's events) — mirrors the original's
 * ehFeat/ehStageIdx globals plus the ehAsset/ehStages lazy-init helpers.
 */
export function useEventHistory(network: NetworkState, networkDispatch: Dispatch<NetworkAction>): UseEventHistoryResult {
  const [openUtil, setOpenUtil] = useState<LineFeature['util'] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState<number | null>(null);

  const feature =
    openUtil && openId ? ((featureById(network, openUtil, openId) as LineFeature | undefined) ?? null) : null;

  function open(f: LineFeature) {
    const patch: { asset?: AssetRecord; stages?: ReturnType<typeof defaultStages> } = {};
    if (!f.props.asset) patch.asset = defaultAsset(f);
    if (!Array.isArray(f.props.stages)) patch.stages = defaultStages();
    if (patch.asset || patch.stages) {
      networkDispatch({ type: 'UPDATE_FEATURE_PROPS', util: f.util, id: f.id, props: patch });
    }
    setOpenUtil(f.util);
    setOpenId(f.id);
    setStageIndex(null);
  }

  function close() {
    setOpenUtil(null);
    setOpenId(null);
    setStageIndex(null);
  }

  function openStage(i: number) {
    setStageIndex(i);
  }

  function backToStages() {
    setStageIndex(null);
  }

  function onEscape() {
    if (stageIndex !== null) backToStages();
    else close();
  }

  function updateAsset(patch: Partial<AssetRecord>) {
    if (!feature) return;
    const asset = { ...(feature.props.asset ?? defaultAsset(feature)), ...patch };
    networkDispatch({ type: 'UPDATE_FEATURE_PROPS', util: feature.util, id: feature.id, props: { asset } });
  }

  function addStage(name: string) {
    if (!feature) return;
    const stages = [...(feature.props.stages ?? []), { name, events: [] }];
    networkDispatch({ type: 'UPDATE_FEATURE_PROPS', util: feature.util, id: feature.id, props: { stages } });
  }

  function removeStage(i: number) {
    if (!feature) return;
    const stages = (feature.props.stages ?? []).filter((_, idx) => idx !== i);
    networkDispatch({ type: 'UPDATE_FEATURE_PROPS', util: feature.util, id: feature.id, props: { stages } });
    if (stageIndex === i) setStageIndex(null);
    else if (stageIndex !== null && stageIndex > i) setStageIndex(stageIndex - 1);
  }

  function addEvent() {
    if (!feature || stageIndex === null) return;
    const stages = (feature.props.stages ?? []).map((s, idx) => {
      if (idx !== stageIndex) return s;
      const event: EventRecord = { no: String(s.events.length + 1), title: '', date: '', desc: '' };
      return { ...s, events: [...s.events, event] };
    });
    networkDispatch({ type: 'UPDATE_FEATURE_PROPS', util: feature.util, id: feature.id, props: { stages } });
  }

  function removeEvent(i: number) {
    if (!feature || stageIndex === null) return;
    const stages = (feature.props.stages ?? []).map((s, idx) => {
      if (idx !== stageIndex) return s;
      return { ...s, events: s.events.filter((_, ei) => ei !== i) };
    });
    networkDispatch({ type: 'UPDATE_FEATURE_PROPS', util: feature.util, id: feature.id, props: { stages } });
  }

  function updateEvent(i: number, patch: Partial<EventRecord>) {
    if (!feature || stageIndex === null) return;
    const stages = (feature.props.stages ?? []).map((s, idx) => {
      if (idx !== stageIndex) return s;
      return { ...s, events: s.events.map((ev, ei) => (ei === i ? { ...ev, ...patch } : ev)) };
    });
    networkDispatch({ type: 'UPDATE_FEATURE_PROPS', util: feature.util, id: feature.id, props: { stages } });
  }

  return {
    feature,
    stageIndex,
    open,
    close,
    openStage,
    backToStages,
    onEscape,
    updateAsset,
    addStage,
    removeStage,
    addEvent,
    removeEvent,
    updateEvent,
  };
}
