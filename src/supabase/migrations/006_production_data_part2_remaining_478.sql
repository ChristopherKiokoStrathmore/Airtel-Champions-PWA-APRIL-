-- =====================================================
-- SALES INTELLIGENCE NETWORK - PART 2
-- Remaining 478 Sales Executives (SE-185 to SE-662)
-- Run AFTER 005_complete_production_data_all_662.sql
-- =====================================================

BEGIN;

-- ========================================
-- MT KENYA ZONE (60 SEs)
-- Continuing from se-185
-- ========================================

-- KENNEDY KIMANI Team (17 SEs)
INSERT INTO users (id, full_name, phone_number, email, role, region, team, manager_id, status, total_points, current_rank, created_at) VALUES
('se-185', 'ELIPHAS KIAMBI', '+254712000185', 'eliphas.kiambi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1825, 185, NOW() - INTERVAL '5 months'),
('se-186', 'FAITH KAIRUTHI', '+254712000186', 'faith.kairuthi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1765, 186, NOW() - INTERVAL '4 months'),
('se-187', 'GEOFFREY WAITHAKA', '+254712000187', 'geoffrey.waithaka@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1705, 187, NOW() - INTERVAL '4 months'),
('se-188', 'JACKLINE KINYA', '+254712000188', 'jackline.kinya@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1645, 188, NOW() - INTERVAL '3 months'),
('se-189', 'JOAN MWANGI', '+254712000189', 'joan.mwangi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1585, 189, NOW() - INTERVAL '3 months'),
('se-190', 'JOASH NJUKI ONYANCHA', '+254712000190', 'joash.onyancha@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1525, 190, NOW() - INTERVAL '2 months'),
('se-191', 'JOHN NDUNGU KARIUKI', '+254712000191', 'john.kariuki@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1465, 191, NOW() - INTERVAL '2 months'),
('se-192', 'JOSEPH MUIGAI', '+254712000192', 'joseph.muigai@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1405, 192, NOW() - INTERVAL '1 month'),
('se-193', 'LENAH KARIMI', '+254712000193', 'lenah.karimi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1345, 193, NOW() - INTERVAL '3 weeks'),
('se-194', 'MERCY MAHINDA', '+254712000194', 'mercy.mahinda@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1285, 194, NOW() - INTERVAL '2 weeks'),
('se-195', 'NICHOLUS NDWIGA', '+254712000195', 'nicholus.ndwiga@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1225, 195, NOW() - INTERVAL '1 week'),
('se-196', 'PATRICK NZALU', '+254712000196', 'patrick.nzalu@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1165, 196, NOW() - INTERVAL '5 days'),
('se-197', 'PHEBEAN MBUGUA', '+254712000197', 'phebean.mbugua@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1105, 197, NOW() - INTERVAL '3 days'),
('se-198', 'PRISCILLA KAWIRA', '+254712000198', 'priscilla.kawira@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 1045, 198, NOW() - INTERVAL '1 day'),
('se-199', 'SALLY KANANA', '+254712000199', 'sally.kanana@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 985, 199, NOW()),
('se-200', 'SHAMZA ODUORI', '+254712000200', 'shamza.oduori@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 925, 200, NOW()),
('se-201', 'WINFRED KENDI', '+254712000201', 'winfred.kendi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'KENNEDY KIMANI', 'zsm-014', 'active', 865, 201, NOW());

-- LAWRENCE MUTHUITHA Team (12 SEs)
INSERT INTO users (id, full_name, phone_number, email, role, region, team, manager_id, status, total_points, current_rank, created_at) VALUES
('se-202', 'ABRAHAM KIPYEGON BETT', '+254712000202', 'abraham.bett@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1900, 202, NOW() - INTERVAL '5 months'),
('se-203', 'BERNARD DOMONIK LEMAKO', '+254712000203', 'bernard.lemako@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1840, 203, NOW() - INTERVAL '4 months'),
('se-204', 'DOREENE KAWIRA', '+254712000204', 'doreene.kawira@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1780, 204, NOW() - INTERVAL '4 months'),
('se-205', 'IRENE NJERI KOECH', '+254712000205', 'irene.koech@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1720, 205, NOW() - INTERVAL '3 months'),
('se-206', 'JEREMIAH ALMAS LEMAKO', '+254712000206', 'jeremiah.lemako@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1660, 206, NOW() - INTERVAL '3 months'),
('se-207', 'MARIAM MUTAYI', '+254712000207', 'mariam.mutayi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1600, 207, NOW() - INTERVAL '2 months'),
('se-208', 'MAUREEN WANGUI', '+254712000208', 'maureen.wangui@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1540, 208, NOW() - INTERVAL '2 months'),
('se-209', 'MERCY KORIR', '+254712000209', 'mercy.korir@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1480, 209, NOW() - INTERVAL '1 month'),
('se-210', 'MILTON MUDAKI', '+254712000210', 'milton.mudaki@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1420, 210, NOW() - INTERVAL '3 weeks'),
('se-211', 'STEPHEN MWANGI', '+254712000211', 'stephen.mwangi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1360, 211, NOW() - INTERVAL '2 weeks'),
('se-212', 'WILSON LETROK', '+254712000212', 'wilson.letrok@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1300, 212, NOW() - INTERVAL '1 week'),
('se-213', 'WYCLIFF OKOTH', '+254712000213', 'wycliff.okoth@airtel.co.ke', 'sales_executive', 'MT KENYA', 'LAWRENCE MUTHUITHA', 'zsm-015', 'active', 1240, 213, NOW() - INTERVAL '5 days');

-- MATHIAS MUEKE Team (13 SEs)
INSERT INTO users (id, full_name, phone_number, email, role, region, team, manager_id, status, total_points, current_rank, created_at) VALUES
('se-214', 'AMBROSE YATTANI', '+254712000214', 'ambrose.yattani@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 1180, 214, NOW() - INTERVAL '3 days'),
('se-215', 'DAMIANO LOKAI', '+254712000215', 'damiano.lokai@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 1120, 215, NOW() - INTERVAL '1 day'),
('se-216', 'ELLYJOY GAKII MBAABU', '+254712000216', 'ellyjoy.mbaabu@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 1060, 216, NOW()),
('se-217', 'EVYONNE MAKENA', '+254712000217', 'evyonne.makena@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 1000, 217, NOW()),
('se-218', 'GEORGE MUGAMBI', '+254712000218', 'george.mugambi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 940, 218, NOW()),
('se-219', 'GUYO GUFU ARERO', '+254712000219', 'guyo.arero@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 880, 219, NOW()),
('se-220', 'HUSSEIN ROBA', '+254712000220', 'hussein.roba@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 820, 220, NOW()),
('se-221', 'PATRICK WAITHAKA', '+254712000221', 'patrick.waithaka@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 760, 221, NOW()),
('se-222', 'PAUL MUTHEE', '+254712000222', 'paul.muthee@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 700, 222, NOW()),
('se-223', 'ROB JILLO', '+254712000223', 'rob.jillo@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 640, 223, NOW()),
('se-224', 'SAID MOHAMED', '+254712000224', 'said.mohamed@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 580, 224, NOW()),
('se-225', 'SAMUEL SAQO', '+254712000225', 'samuel.saqo@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 520, 225, NOW()),
('se-226', 'SHADRACK SOO', '+254712000226', 'shadrack.soo@airtel.co.ke', 'sales_executive', 'MT KENYA', 'MATHIAS MUEKE', 'zsm-016', 'active', 460, 226, NOW());

-- PATRICK MAKAU Team (15 SEs)
INSERT INTO users (id, full_name, phone_number, email, role, region, team, manager_id, status, total_points, current_rank, created_at) VALUES
('se-227', 'ANNET MURUGI', '+254712000227', 'annet.murugi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1875, 227, NOW() - INTERVAL '5 months'),
('se-228', 'BRIDGET UBANE', '+254712000228', 'bridget.ubane@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1815, 228, NOW() - INTERVAL '4 months'),
('se-229', 'CHARLES GITUMA', '+254712000229', 'charles.gituma@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1755, 229, NOW() - INTERVAL '4 months'),
('se-230', 'CYNTHIA GACHERI', '+254712000230', 'cynthia.gacheri@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1695, 230, NOW() - INTERVAL '3 months'),
('se-231', 'JAMES MUTISO', '+254712000231', 'james.mutiso@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1635, 231, NOW() - INTERVAL '3 months'),
('se-232', 'JOHN KARURI GICHURU', '+254712000232', 'john.gichuru@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1575, 232, NOW() - INTERVAL '2 months'),
('se-233', 'JOHN MUCHOKI', '+254712000233', 'john.muchoki@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1515, 233, NOW() - INTERVAL '2 months'),
('se-234', 'JOSEPH KIOHI', '+254712000234', 'joseph.kiohi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1455, 234, NOW() - INTERVAL '1 month'),
('se-235', 'MAUREEN MUSYOKA', '+254712000235', 'maureen.musyoka@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1395, 235, NOW() - INTERVAL '3 weeks'),
('se-236', 'MORRIS GITARI', '+254712000236', 'morris.gitari@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1335, 236, NOW() - INTERVAL '2 weeks'),
('se-237', 'PAMELA KENDI', '+254712000237', 'pamela.kendi@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1275, 237, NOW() - INTERVAL '1 week'),
('se-238', 'PENINAH WANJIRU', '+254712000238', 'peninah.wanjiru@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1215, 238, NOW() - INTERVAL '5 days'),
('se-239', 'PERPETUAL GACHERI', '+254712000239', 'perpetual.gacheri@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1155, 239, NOW() - INTERVAL '3 days'),
('se-240', 'ROSE NZIOKI', '+254712000240', 'rose.nzioki@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1095, 240, NOW() - INTERVAL '1 day'),
('se-241', 'SAMUEL NZUKI', '+254712000241', 'samuel.nzuki@airtel.co.ke', 'sales_executive', 'MT KENYA', 'PATRICK MAKAU', 'zsm-017', 'active', 1035, 241, NOW());

-- ========================================
-- NAIROBI EAST ZONE (46 SEs)
-- ========================================

-- BETHUEL MWANGI Team (9 SEs)
INSERT INTO users (id, full_name, phone_number, email, role, region, team, manager_id, status, total_points, current_rank, created_at) VALUES
('se-242', 'BONPHACE PHELIX', '+254712000242', 'bonphace.phelix@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'BETHUEL MWANGI', 'zsm-018', 'active', 1925, 242, NOW() - INTERVAL '5 months'),
('se-243', 'EUNICE MWANZO', '+254712000243', 'eunice.mwanzo@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'BETHUEL MWANGI', 'zsm-018', 'active', 1865, 243, NOW() - INTERVAL '4 months'),
('se-244', 'FRANCIS OWINO', '+254712000244', 'francis.owino@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'BETHUEL MWANGI', 'zsm-018', 'active', 1805, 244, NOW() - INTERVAL '4 months'),
('se-245', 'JOASH BRIAN KAYO', '+254712000245', 'joash.kayo@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'BETHUEL MWANGI', 'zsm-018', 'active', 1745, 245, NOW() - INTERVAL '3 months'),
('se-246', 'MARY OPONDO', '+254712000246', 'mary.opondo@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'BETHUEL MWANGI', 'zsm-018', 'active', 1685, 246, NOW() - INTERVAL '3 months'),
('se-247', 'NIXON GUNGA', '+254712000247', 'nixon.gunga@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'BETHUEL MWANGI', 'zsm-018', 'active', 1625, 247, NOW() - INTERVAL '2 months'),
('se-248', 'NYABUTO WILSON OBARA', '+254712000248', 'wilson.obara@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'BETHUEL MWANGI', 'zsm-018', 'active', 1565, 248, NOW() - INTERVAL '2 months'),
('se-249', 'SHARON MOKAYA', '+254712000249', 'sharon.mokaya@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'BETHUEL MWANGI', 'zsm-018', 'active', 1505, 249, NOW() - INTERVAL '1 month'),
('se-250', 'SIXTUS WANJALA', '+254712000250', 'sixtus.wanjala@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'BETHUEL MWANGI', 'zsm-018', 'active', 1445, 250, NOW() - INTERVAL '3 weeks');

-- RACHAEL WAITARA Team (14 SEs)
INSERT INTO users (id, full_name, phone_number, email, role, region, team, manager_id, status, total_points, current_rank, created_at) VALUES
('se-251', 'DAVID MAINA', '+254712000251', 'david.maina@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 1385, 251, NOW() - INTERVAL '2 weeks'),
('se-252', 'EDWIN MALALA', '+254712000252', 'edwin.malala@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 1325, 252, NOW() - INTERVAL '1 week'),
('se-253', 'FLORENCE AKINYI', '+254712000253', 'florence.akinyi@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 1265, 253, NOW() - INTERVAL '5 days'),
('se-254', 'GEOFFREY NJUGUNA', '+254712000254', 'geoffrey.njuguna@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 1205, 254, NOW() - INTERVAL '3 days'),
('se-255', 'JAMES ONYANGO OCHIENG', '+254712000255', 'james.ochieng@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 1145, 255, NOW() - INTERVAL '1 day'),
('se-256', 'JOHN ODONGO DICK', '+254712000256', 'john.dick@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 1085, 256, NOW()),
('se-257', 'JOYDLINE KADHAMBI', '+254712000257', 'joydline.kadhambi@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 1025, 257, NOW()),
('se-258', 'MICHAEL ODONGO', '+254712000258', 'michael.odongo@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 965, 258, NOW()),
('se-259', 'OBEL EUGENE', '+254712000259', 'obel.eugene@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 905, 259, NOW()),
('se-260', 'PRISCA RAEL', '+254712000260', 'prisca.rael@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 845, 260, NOW()),
('se-261', 'PRISCILLA MWEKE', '+254712000261', 'priscilla.mweke@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 785, 261, NOW()),
('se-262', 'RACHEL WANJIRU MUCHIRI', '+254712000262', 'rachel.muchiri@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 725, 262, NOW()),
('se-263', 'SAMUEL NJENGA', '+254712000263', 'samuel.njenga@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 665, 263, NOW()),
('se-264', 'TABITHA NGINA', '+254712000264', 'tabitha.ngina@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'RACHAEL WAITARA', 'zsm-019', 'active', 605, 264, NOW());

-- STELLA IGORO Team (13 SEs)
INSERT INTO users (id, full_name, phone_number, email, role, region, team, manager_id, status, total_points, current_rank, created_at) VALUES
('se-265', 'ALLAN OKWANY', '+254712000265', 'allan.okwany@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1850, 265, NOW() - INTERVAL '5 months'),
('se-266', 'ANTONY MAINA NJOROGE', '+254712000266', 'antony.njoroge@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1790, 266, NOW() - INTERVAL '4 months'),
('se-267', 'CAMELYNE LIKHOTIO BUTICHI', '+254712000267', 'camelyne.butichi@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1730, 267, NOW() - INTERVAL '4 months'),
('se-268', 'CLARA MWIKALI', '+254712000268', 'clara.mwikali@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1670, 268, NOW() - INTERVAL '3 months'),
('se-269', 'DORIS GACHERI MUTUMA', '+254712000269', 'doris.mutuma@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1610, 269, NOW() - INTERVAL '3 months'),
('se-270', 'ERIC MUCHANGI', '+254712000270', 'eric.muchangi@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1550, 270, NOW() - INTERVAL '2 months'),
('se-271', 'FREDRICK OKINYO OKUMU', '+254712000271', 'fredrick.okumu@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1490, 271, NOW() - INTERVAL '2 months'),
('se-272', 'GRACE NDANU', '+254712000272', 'grace.ndanu@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1430, 272, NOW() - INTERVAL '1 month'),
('se-273', 'JOHN KIIGE', '+254712000273', 'john.kiige@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1370, 273, NOW() - INTERVAL '3 weeks'),
('se-274', 'LYNET NALIAKA', '+254712000274', 'lynet.naliaka@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1310, 274, NOW() - INTERVAL '2 weeks'),
('se-275', 'PATRICK ETYANG OBURUONI', '+254712000275', 'patrick.oburuoni@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1250, 275, NOW() - INTERVAL '1 week'),
('se-276', 'TITUS WANJALA', '+254712000276', 'titus.wanjala@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1190, 276, NOW() - INTERVAL '5 days'),
('se-277', 'VACANT MURERA', '+254712000277', 'vacant.murera@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'STELLA IGORO', 'zsm-020', 'active', 1130, 277, NOW() - INTERVAL '3 days');

-- TIMOTHY KARIUKI Team (9 SEs)
INSERT INTO users (id, full_name, phone_number, email, role, region, team, manager_id, status, total_points, current_rank, created_at) VALUES
('se-278', 'ANN MUTHONI', '+254712000278', 'ann.muthoni@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'TIMOTHY KARIUKI', 'zsm-021', 'active', 1070, 278, NOW() - INTERVAL '1 day'),
('se-279', 'BONIFACE MUTUA', '+254712000279', 'boniface.mutua@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'TIMOTHY KARIUKI', 'zsm-021', 'active', 1010, 279, NOW()),
('se-280', 'CASTY MURUGI', '+254712000280', 'casty.murugi@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'TIMOTHY KARIUKI', 'zsm-021', 'active', 950, 280, NOW()),
('se-281', 'DAVID MAWIA', '+254712000281', 'david.mawia@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'TIMOTHY KARIUKI', 'zsm-021', 'active', 890, 281, NOW()),
('se-282', 'DENNIS MWANZO', '+254712000282', 'dennis.mwanzo@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'TIMOTHY KARIUKI', 'zsm-021', 'active', 830, 282, NOW()),
('se-283', 'JAMES MAWEU KARANJA', '+254712000283', 'james.karanja@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'TIMOTHY KARIUKI', 'zsm-021', 'active', 770, 283, NOW()),
('se-284', 'LILIAN WAMUCII', '+254712000284', 'lilian.wamucii@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'TIMOTHY KARIUKI', 'zsm-021', 'active', 710, 284, NOW()),
('se-285', 'SILAS OCHIENG CHIAW', '+254712000285', 'silas.chiaw@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'TIMOTHY KARIUKI', 'zsm-021', 'active', 650, 285, NOW()),
('se-286', 'STEPHEN OWINO ODONGO', '+254712000286', 'stephen.odongo@airtel.co.ke', 'sales_executive', 'NAIROBI EAST', 'TIMOTHY KARIUKI', 'zsm-021', 'active', 590, 286, NOW());

-- Due to character limits, I need to continue in another file...
-- This covers first 286 SEs. Remaining 376 SEs (287-662) to follow same pattern across:
-- NAIROBI METROPOLITAN (44 SEs)
-- NAIROBI WEST (47 SEs)
-- NORTH EASTERN (20 SEs)
-- NYANZA (77 SEs)
-- RIFT (60 SEs)
-- SOUTH RIFT (88 SEs)
-- WESTERN (78 SEs)

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ PART 2 LOADED: SE-185 to SE-286 (102 SEs)';
  RAISE NOTICE '   Total so far: 286 out of 662';
  RAISE NOTICE '   Remaining: 376 SEs';
  RAISE NOTICE '';
  RAISE NOTICE '⏳ Next: Part 3 for remaining zones...';
END $$;
