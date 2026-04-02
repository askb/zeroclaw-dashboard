// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2026 Anil Belur <askb23@gmail.com>

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/tasks");
}
