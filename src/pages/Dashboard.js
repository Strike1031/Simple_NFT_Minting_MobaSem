import "bootstrap/dist/css/bootstrap.min.css";

import React, {ReactDOM, useState} from 'react';
import { ethers } from 'ethers';
import {Container, Button, Card, Form, Spinner} from 'react-bootstrap';
import MoBasemABI from "../ABI/MoBasemABI.json";
import Web3 from "web3";
import {MoBasemAddress, RINKEBY_NET, CHAINID, toWEI} from "../constants/Constants"


function Dashboard() {

    //spinner show and show message
    const [isloading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    //display wallet information
    const [data, setdata] = useState({
        address: "",
        Balance: null

    });
    const [web3Provider, setweb3Provider] = useState("")
    //mint amount
    const [amount, setAmount] = useState(1);
    //get metamask account
    const Metamask_connect = async() => {
        let currentProvider;
        //spinner set
        setLoading(true);
        setMessage("Loading...");
        //
        if (window.ethereum === undefined || !window.ethereum.isMetaMask) {

            return false;
        }

        if (window.ethereum)
        {
            //res[0]==the first wallet
            setweb3Provider(window.ethereum);
            currentProvider = window.ethereum;
            //window.ethereum.request({method: "eth_requestAccounts"}).then((res)=> accountChangeHandler(res[0]));
            try {
                await window.ethereum.request({method: "eth_requestAccounts"});
            } catch(error) {
                setLoading(false);
                setMessage("Denied wallet access...");

                console.log("denied wallet access...");    
                return false;
            }
         } else if (window.web3)
        {
            setweb3Provider(window.web3.currentProvider);
            currentProvider = window.web3.currentProvider;
        }
        else
        {
            const provider = new Web3.providers.HttpProvider(RINKEBY_NET);
            setweb3Provider( provider);
            currentProvider = provider;
        }


        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{chainId: CHAINID}]
            });
        } catch (error) {
            //error:4902 is that  add the ethereum chain network to metamask
            if (error == 4902)
            {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [{chainId: CHAINID, rpcUrl: RINKEBY_NET}]
                    });
                } catch(error) {
                    //log
                }
            }
           
            setLoading(false);
            setMessage("Add EthereumChain Error...");
            return false;
        }

        const web3 = new Web3(currentProvider);
        let account;
        let is_admin = false;
        let is_connected = false;
        [account] = await web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                setLoading(false);
                setMessage("getAccounts error");

                console.log("getAccounts error", error);
                return;
            }
            is_connected = true;
            return accounts[0];            
        });
        accountChangeHandler(account);
        //Success
        setLoading(false);
        setMessage("Metamask Connection Success...");
        console.log("acountAddress::"+account);


    };


    const accountChangeHandler = (account) => {
        setdata(prevState => ({...prevState, address: account}));
        //set the balance of this wallet
        getBalance(account);
    };

    //getBalance is to get the balance of pointed wallet
    const getBalance = (address) => {
        window.ethereum.request({method:"eth_getBalance", params: [address, "latest"]}).then(
            (balance) => {
                setdata(prevState => ({...prevState, Balance: ethers.utils.formatEther(balance)}));
            });
    };

    //click mint button
    const btnMintNFT = async () => {
        
        //Loading Mint display......
        setLoading(true);
        setMessage("Minting...");
        ///
        console.log(web3Provider);
        const web3 = new Web3(web3Provider);
        const MoBasemToken = new web3.eth.Contract(MoBasemABI, MoBasemAddress);
        //setPresaleStatus(false)
        // await MoBasemToken.methods.setPresaleStatus(false).send({from: data.address}, function(err,res) {
        //     if (err)
        //     {
        //         setLoading(false);
        //         setMessage("Mint Error???");
        //         console.log("PublicSale Status Set Error",err);
        //         return;
        //     }
        // });

        // await MoBasemToken.methods.setPublicSaleStatus(true).send({from: data.address}, function(err,res) {
        //     if (err)
        //     {
        //         setLoading(false);
        //         setMessage("Mint Error???");
        //         console.log("PublicSale Status Set Error",err);
        //         return;
        //     }
        // });
        
        const publicSalePrice = await MoBasemToken.methods.publicSalePrice().call(function(err,res){
            if (err)
            {
                setLoading(false);
                setMessage("Mint Error???");
                console.log("public sale price reading error", err);
                return;
            }
            return res;
        });
       console.log("PublicSalePrice:"+publicSalePrice);
     
        await MoBasemToken.methods.clientMint(amount).send({from: data.address, value: toWEI( amount * ethers.utils.formatEther(publicSalePrice))}, function(err,res) {
            if (err)
            {
                setLoading(false);
                setMessage("Mint Error???");

                console.log("Mint Error???",err);
                return;
            }
        });

        setLoading(false);
        setMessage("Mint Success!!!");

      
        console.log("Mint Success!!!!!!!");
      //  window.alert("Mint Success!!!!!!!");
    };

    return(
        
        <Container>
            <Card className="text-center">
                <Card.Header>
                    <strong>Address: </strong>
                    {data.address}
                </Card.Header>
                <Card.Body>
                    <Card.Text>
                        <strong>Balance: </strong>
                        {data.Balance? data.Balance + " ETH" : "0 ETH"} 
                    </Card.Text>
                    <Button onClick={Metamask_connect} variant="primary">
                        Connect to wallet
                    </Button>
                </Card.Body>
            </Card>
            
            <Form style={{margin: "100px 0 50px 0"}}>
                <Form.Group>
                    <Form.Label> Mint Number</Form.Label>
                    <Form.Control type="number" placeholder="Mint Number" value={amount} onChange={(e)=>{
                        //console.log("e: ", e);
                        setAmount(e.target.value)
                    }}></Form.Control>
                </Form.Group>       
            </Form>
            <Button variant="primary" onClick={btnMintNFT}>Mint NFT</Button>

            <div style={{marginTop: "50px", alignItems: "center"}}>
                {isloading? <Spinner as="span" animation="border" variant="success"  role="status" aria-hidden="true"/> 
                : ""}
                <span style={{fontSize: "18px", marginLeft: "20px"}}>{message}</span>
            </div>
                       
        </Container>
    );
}

export default Dashboard;