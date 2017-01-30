const eth=require('skypetwrapper');
const getEthereumStart=eth.getEthereumStart;
const addAttribute=eth.addAttribute;
const getAttributes=eth.getAttributes;
const closeGeth=eth.closeGeth;
const checkAccount=eth.checkAccount;
const createAccount=eth.createAccount;
const getAccounts=eth.getAccounts;
const checkPassword=eth.checkPassword;
const getContract=eth.getContract;
const watchContract=eth.watchContract;
const getCost=eth.getCost;
const getMoneyInAccount=eth.getMoneyInAccount;
const getSync=eth.getSync;

const returnSuccessError=(event, err, result)=>{
    return err?event.sender.send("passwordError", err):event.sender.send("successLogin", result);
}
function SkyPetApi(event){
    let geth;
    let contract;
    const syncHelper=(event)=>{
        contract=getContract(); 
        getAccounts((err, account)=>{
            if(!err){
                getMoneyInAccount(account, (err, balance)=>{
                    event.sender.send("moneyInAccount", balance);
                })
                event.sender.send("account", account);
                event.sender.send("sync", {currentProgress:100, isSyncing:false});
            }
        })
        getCost(contract, (err, result)=>{
            err?"":event.sender.send("cost", result);
        })
    }
    this.close=()=>{
        if(geth){
            closeGeth(geth);
        }
    }
    //Dont expose this to the public.  Private only!
    event.on('startEthereum', (event, arg)=>{
        getEthereumStart((gethInstance)=>{
            geth=gethInstance;
            getSync((progress)=>{
                event.sender.send("sync", {currentProgress:progress, isSyncing:true});
            }, ()=>{
                syncHelper(event);
            })
        });
    })
    event.on('password', (event, arg)=>{
        getAccounts((err, result)=>{
            return err?createAccount(arg, (err, result)=>{
                returnSuccessError(event, err, result);
            }):checkPassword(arg, (err, result)=>{
                returnSuccessError(event, err, result);
            })
        });
    })
    event.on('addAttribute', (event, arg) => {
        contract?addAttribute(arg.password,arg.message, arg.hashId, contract, (err, result)=>{
            err?event.sender.send("passwordError", err):event.sender.send("attributeAdded", true);
        }):"";
    });
    event.on('id', (event, hashId)=>{
        contract?getAttributes(contract, hashId,  (err, attributes)=>{
            err?"":event.sender.send("retrievedData", attributes);
        }):"";
        contract?watchContract(contract, hashId,  (err, attributes)=>{
            err?"":event.sender.send("retrievedData", attributes);
        }, (err, balance)=>{
            err?"":event.sender.send("moneyInAccount", balance);
        }):"";
    });
    event.on('getAttributes', (event, hashId) => {
        contract?getAttributes(contract, hashId, (err, result)=>{
            err?"":event.sender.send("retrievedData", result);
        }):"";
    });
}
exports.SkyPetApi=SkyPetApi;