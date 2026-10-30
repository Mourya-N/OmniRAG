"""Enterprise Knowledge Graph Subsystem for Multi-Hop Relationship Traversal."""

import re
from typing import Any
from pydantic import BaseModel, Field


class EntityNode(BaseModel):
    """An entity in the knowledge graph."""

    entity_id: str
    name: str
    entity_type: str  # Technology, Architecture, Metric, Organization, Service
    chunk_ids: set[str] = Field(default_factory=set)


class RelationEdge(BaseModel):
    """A directed relationship connecting two entities."""

    source_id: str
    target_id: str
    relation_type: str  # USES, IMPLEMENTS, DEPENDS_ON, CONTAINS, MANAGES
    chunk_ids: set[str] = Field(default_factory=set)


class KnowledgeGraphEngine:
    """In-memory and relational graph representation with multi-hop BFS traversal."""

    def __init__(self) -> None:
        self.nodes: dict[str, EntityNode] = {}  # entity_id -> node
        self.name_to_id: dict[str, str] = {}    # normalized_name -> entity_id
        self.adjacency: dict[str, list[RelationEdge]] = {}  # entity_id -> list of outgoing edges

    def add_entity(self, name: str, entity_type: str, chunk_id: str | None = None) -> EntityNode:
        """Upsert an entity node into the graph."""
        norm_name = name.strip().lower()
        if norm_name in self.name_to_id:
            eid = self.name_to_id[norm_name]
            node = self.nodes[eid]
            if chunk_id:
                node.chunk_ids.add(chunk_id)
            return node

        eid = f"ent_{len(self.nodes) + 1}"
        node = EntityNode(
            entity_id=eid,
            name=name.strip(),
            entity_type=entity_type,
            chunk_ids={chunk_id} if chunk_id else set(),
        )
        self.nodes[eid] = node
        self.name_to_id[norm_name] = eid
        self.adjacency[eid] = []
        return node

    def add_relation(
        self,
        source_name: str,
        target_name: str,
        relation_type: str,
        chunk_id: str | None = None,
    ) -> RelationEdge:
        """Add a directed relation between two entities."""
        src_node = self.add_entity(source_name, "Entity", chunk_id)
        tgt_node = self.add_entity(target_name, "Entity", chunk_id)

        edge = RelationEdge(
            source_id=src_node.entity_id,
            target_id=tgt_node.entity_id,
            relation_type=relation_type.upper(),
            chunk_ids={chunk_id} if chunk_id else set(),
        )
        self.adjacency[src_node.entity_id].append(edge)
        return edge

    def traverse_hops(self, start_entity_name: str, max_hops: int = 2) -> list[dict[str, Any]]:
        """Breadth-first search traversing up to max_hops from the start entity."""
        norm_name = start_entity_name.strip().lower()
        if norm_name not in self.name_to_id:
            return []

        start_id = self.name_to_id[norm_name]
        visited: set[str] = {start_id}
        queue: list[tuple[str, int, list[str]]] = [(start_id, 0, [self.nodes[start_id].name])]
        results: list[dict[str, Any]] = []

        while queue:
            curr_id, hops, path = queue.pop(0)
            if hops >= max_hops:
                continue

            for edge in self.adjacency.get(curr_id, []):
                tgt_id = edge.target_id
                tgt_node = self.nodes[tgt_id]
                new_path = path + [edge.relation_type, tgt_node.name]

                results.append(
                    {
                        "source": self.nodes[curr_id].name,
                        "relation": edge.relation_type,
                        "target": tgt_node.name,
                        "hop_distance": hops + 1,
                        "chunk_ids": list(edge.chunk_ids | tgt_node.chunk_ids),
                        "path": " -> ".join(new_path),
                    }
                )

                if tgt_id not in visited:
                    visited.add(tgt_id)
                    queue.append((tgt_id, hops + 1, new_path))

        return results

