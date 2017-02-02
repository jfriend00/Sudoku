module.exports = {
	patterns: {
        b1:                             "780100400506037001003000060970060300600304050350019004009000500265890000037045200",
        b2:                             "000800001200034960304090002005306000040000500702100000950200040007465000403080020",
        b3:                             "000500207090000400706004083040050008009403700500080020160200309004000070907001000",
        b4:                             "051347800400000005000506000023408650580000041004005200007000500900750006005962700", 
        b5:                             "005346700000000000080205010230000047040020080608000502004050300050030060700894001",
        myPuzzleOrgDiabolic01092017:    "300000869000200070009000005210030900000040000005080013500000200070006000846000001",
        phone1:                         "000300290050070610006009740100800307670123409000704060020000536860030070003600004",
        myPuzzleOrgVeryHard01092017:    "320416089008000300000305000400000007003601400500020003710050064000000000806040201",
        nakedPair1:                     "320001400900402003006070009801005000000106000000700108100090500200804007004500031",
        nakedPair2:                     "700000201003807000260000050601900400020000080004002906030000049000105800806000007",
        nakedTriplet1:                  "008010000230009000500008020005020080300000006080090500040600009000300014000080700",
        blockBlock1:                    "000003948309008500004000002500900000007010600000007001600000100008700209175300000",
        hiddenTrip:                     "097100340010230007800700000009002000020503070000800200000006004900057060063001850",
        hiddenQuad:                     "502600700000900010000000385004096100000000000005270900837000000060009000009008203",
        xwing1:                         "000130005040000200800900000000050900002000400003060000000003006005000010700028000",
        swordfish1:                     "000470600004000305920000000031000000000936000000000280000000016408000900007052000",
        xywing1:                        "090000000000000678000063050000300000008050201005290300009005000800034000302008004",    
        xywing2:                        "684070000300000070000510000800400100051080960007006002000045000090000005000020843",    
        hardOnline1:                    "320000869050200374009000125210635907000040002005082013500000206072006008846020701",
        hardOnline2:                    "340007096000040307279306084003125009001070603790634015004762938900483001837591462",
        mypuzzleorg01022017veryhard:    "207080006040002079500000004002030000000105000000020100800000007650900020900060805",
        mypuzzleorg01032017veryhard:    "010070640200009000009500700020000000600703005000000030001002900000800001067090050",
        mypuzzleorg01132017veryhard:    "307001096160000008000060003013005000000000000000900140700030000800000029940700801",    
        mypuzzleorg01132017averyhard:   "357081096160390578000567013013605980500008360600903145721839654830000729940700831",
        mypuzzleorg01062017veryhard:    "165378249478259136239006008380504092000097384094823010013982460900701803800035901",
        finnedxwing:                    "900040000704080050080000100007600820620400000000000019000102000890700000000050003",
        sashimifinnedxwing:             "300012598001080763080700241700001380003870010108200075519308027030190850804520139",
        platinumBlondeHardestSudoku:    "000000012000000003002300400001800005060070800000009000008500000900040500470006000",
        finnedSwordFish:                "094002160126300500000169040481006005062010480900400010240690050019005030058700920",
        finnedJellyFish:                "094002160126300500000169040481006005062010480900400010240690050019005030058700920",
        finnedXWing1:                   "094002160126300500000169040481006005062010480900400010240690050019005030058700920",
        alignedPairExclusion1:          "040238600060140003203560041002475300007891400400326000824753006900604030006902054",
        alignedPairExclusion2:          "030050089405309006009010003500690038803070904290038007058960342300045891940003675",
        rectanglesType1:                "020457609405009207700000345280070190650080720007004856046000071002700468870040032",
        rectanglesType2:                "000040507657100800489007000004070659970010483508490271800700920790284005205060708",
        rectanglesType3:                "003094678600701309709063050004010000090000030000029500576138004938642715400975863",
        rectanglesType4:                "135249070040816000682050419060070300073020040051060007394681725510032000020590100",
        xchain1:                        "013700000200069403000300070390002860640030029025690341530006000104950032000003050",
        xchain2:                        "405260791029175406167409205210056070570002160006741052641500027700624510052017648",
        xchain3:                        "013700000200069403000300070390002860640030029025690341530006000104950032000003050",
        almostLockedSet1:               "000000807000810230300007060000608300165273489003104000040701003032985000901000008",
        almostLockedSet2:               "150704200600238001008150000005401002004387100810520704000013920002045017001072040",
        worldsHardest:                  "800000000003600000070090200050007000000045700000100030001000068008500010090000400",
        jellyFish:                      "284030600300207004600000002020500070000002481090600020900000003700901008168020700",
        // we find the type1 rectangle in uniqueRectangleType1 and process it, but can't solve the rest of the puzzle
        uniqueRectangleType1:           "006324815850691070001785000004037680380062147067418350000173008000846021008259700",
        uniqueRectangleType2:           "420900386060200794809060251700003025900102603200500008004020567682700439000000812",
        uniqueRectangleType2B:          "041865390090040060030792401028000940519624003070908210150080629060019030980206100",
        // we do not find the rectangle in uniqueRectangleType2C because the possibles are not reduced enough before we see it
        // sudokuwiki.org uses 3-D medusa to get rid of the necessary possibles before you can see the rectangle
        uniqueRectangleType2C:          "809000050530807000000090800294608130780901004015004098002080000058103070060000480",
        // we find the type3 rectangle in uniqueRectangleType3 and process it, but can't solve the rest of the puzzle
        uniqueRectangleType3:           "000503470500804060400096052857009604324607590006005037285061040009008005043952086",
        uniqueRectangleType3B:          "419020006060109000030465921090201080001050290070904010006502079050398062920000008",
        uniqueRectangleType3BPseudo:    "752908040300210000010000280063082009027090508800100032271009804000021307030874020",
        uniqueRectangleType4:           "006324815850691070001785000004037680380062147067418350000173008000846021008259700",
        uniqueRectangleType4B:          "748359126001726840026400705200040087074030000180070004402007608017003402805204070",
        alignedPairExclusionType1:      "097103040030040700000670003273914586986007104154068007700091000009736050360000070",
        alignedPairExclusionType2:      "000023000620598004000706520598062040201075806076800052062007000800634209000200000",
        xyzWing1:                       "092001750500200008000030200075004960200060075069700030008090020700003089903800040",
        xyzWing2:                       "072000680000700000500016000000028100200371006004560000000130004000007000015000890",
        xyzWing3:                       "000100000000000980705062310109007403000000000807200105091740802053000000000001000",
        xyzWing4:                       "008207090000000420400010056000980000006000100000023000760090004082000000040801200",
        xyzWing5:                       "900850000050201000600030008005070012080000070730010500100020003000109020000043006",
        xchainRule4_1:                  "007083600039706800826419753640190387080367000073048060390870026764900138208630970",
        xchainRule4_2:                  "100400006046091080005020000000500109090000050402009000000010900080930560500008004",
        xchainRule4_3:                  "000906000600008007100370009006000750004030100095000800200065008900800005000103000",
        xchainRule4_4:                  "400800003006010409000005000010060092000301000640050080000600000907080100800009004",
        xchainRule4_5:                  "090200350012003000300008000000017000630000089000930000000700002000300190078009030",
        xchainRule4_6:                  "000000070000090810500203004800020000045000720000000003400308006072010000030000000",
        xchainRule4_7:                  "062900000004308000709000400600801000003000200000207003001000904000709300000004120",
        xchainRule2_1:                  "527030498394278615681594273940010307130407069876359124068903001419065032053000906",
        xcycleloop1:                    "024100670060070410700964020246591387135487296879623154400009760350716940697040031",
        
    },
    unsolved: {
        b3: 39,
        myPuzzleOrgDiabolic01092017: 40,
        hardOnline1: 40,
        sashimifinnedxwing: 33,
        platinumBlondeHardestSudoku: 59,
        finnedSwordFish: 40,
        finnedJellyFish: 40,
        finnedXWing1: 40,
        alignedPairExclusion1: 36,
        alignedPairExclusion2: 35,
        rectanglesType1: 17,
        rectanglesType4: 35,
        xchain1: 42,
        xchain2: 25,
        xchain3: 42,
        almostLockedSet1: 45,
        almostLockedSet2: 40,
        worldsHardest: 60,
        uniqueRectangleType1: 31,
        uniqueRectangleType2C: 45,
        uniqueRectangleType3: 35,
        uniqueRectangleType3BPseudo: 40,
        uniqueRectangleType4: 31,
        uniqueRectangleType4B: 35,
        xyzWing1: 28,
        alignedPairExclusionType2: 42,
        
    }
};




