// ============================================================================
// MINDCAST — DAG Zero-Gas Micro-Voting API Route
// ============================================================================
// POST /api/dag/micro-vote

import { NextRequest, NextResponse } from "next/server";
import { LivingLatticeDagEngine } from "@/lib/blockchain/dag-settlement";
import { getAgent, createAgentEvent } from "@/lib/database/queries";
import { AgentEventType } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voterAddress, mindId, type, amount } = body;

    if (!voterAddress || !mindId) {
      return NextResponse.json(
        { error: "Missing voterAddress or mindId" },
        { status: 400 }
      );
    }

    const agent = getAgent(mindId);
    if (!agent) {
      return NextResponse.json({ error: "Mind not found" }, { status: 404 });
    }

    // Process on MYCA Living Lattice DAG (Chain 108) with ZERO GAS
    const tx = await LivingLatticeDagEngine.executeMicroTransaction({
      voterAddress,
      mindId,
      type: type || "VOTE",
      amount: amount || 0.1,
    });

    // Log the DAG event to the Mind timeline
    createAgentEvent(
      mindId,
      AgentEventType.PREDICTION_CREATED,
      `[Living Lattice DAG] Zero-gas micro-${tx.type.toLowerCase()} received from ${voterAddress.slice(0, 6)}...${voterAddress.slice(-4)} (Tx: ${tx.txHash})`
    );

    return NextResponse.json({
      success: true,
      transaction: tx,
      message: "Micro-transaction notarized on MYCA Living Lattice DAG with 0.00$ gas.",
    });
  } catch (err: any) {
    console.error("[DAG API] Micro-vote error:", err);
    return NextResponse.json({ error: "Failed to process DAG micro-transaction" }, { status: 500 });
  }
}
